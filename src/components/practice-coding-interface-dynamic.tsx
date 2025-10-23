"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { SqlPracticeInterface } from "./sql-practice-interface";
import { formatDatasetValue } from "@/lib/utils";
import {
  PlayCircle,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  RotateCcw,
  Database,
  Table,
  FileSpreadsheet,
  BarChart3,
  Code,
  Server,
  Search,
  Eye,
  Settings,
  BookOpen,
  Calculator
} from "lucide-react";

type TestCase = {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  points?: number;
  actual_output?: string;
  passed?: boolean;
  execution_time?: number;
  exit_code?: number;
  error_message?: string;
};

type ExecutionResult = {
  success: boolean;
  passed: boolean;
  score: number;
  total_points: number;
  test_results?: TestCase[];
  sql_results?: any[];
  statistical_results?: any;
  chart_data?: any;
  overall_result: {
    stdout: string;
    stderr: string;
    execution_time: number;
    memory_used: number;
    exit_code: number;
  };
  attempt_id?: string;
};

type ProgrammingLanguage = {
  id: string;
  name: string;
  version: string;
  extension: string;
};

interface Dataset {
  id: string;
  name: string;
  subject_type: string;
  file_url?: string;
  data_preview?: any[];
  schema?: any;
  record_count?: number;
  columns?: string[];
  table_name?: string;
}

const LANGUAGE_CONFIG = {
  python: {
    name: "Python",
    template: `import pandas as pd
import numpy as np

def solution():
    # Write your Python solution here
    # Dataset: sales_data.csv
    df = pd.read_csv('sales_data.csv')

    # Example analysis
    result = df.groupby('category')['revenue'].sum()
    return result.to_dict()

if __name__ == "__main__":
    print(solution())`,
    icon: Code,
    outputTabs: ['console', 'dataframe', 'chart']
  },
  javascript: {
    name: "JavaScript",
    template: `function solution() {
    // Write your JavaScript solution here
    // Dataset: sales_data.csv
    // Assuming data is available in global scope
    const data = window.dataset || [];

    // Example analysis
    const result = data.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.revenue;
        return acc;
    }, {});

    return result;
}

module.exports = solution;`,
    icon: Code,
    outputTabs: ['console', 'json']
  },
  sql: {
    name: "SQL",
    template: `-- Write your SQL query here
-- Available table: sales_data
-- Columns: product, price, category, units_sold, region, revenue

SELECT
    category,
    SUM(revenue) as total_revenue,
    AVG(price) as avg_price,
    COUNT(*) as product_count
FROM sales_data
GROUP BY category
ORDER BY total_revenue DESC;`,
    icon: Database,
    outputTabs: ['table', 'schema', 'statistics']
  },
  r: {
    name: "R",
    template: `# Write your R solution here
# Dataset: sales_data.csv

library(dplyr)
library(ggplot2)

solution <- function() {
    # Load data
    df <- read.csv('sales_data.csv')

    # Example analysis: Revenue by category
    result <- df %>%
        group_by(category) %>%
        summarise(
            total_revenue = sum(revenue),
            avg_price = mean(price),
            product_count = n()
        ) %>%
        arrange(desc(total_revenue))

    return(result)
}

# Execute
result <- solution()
print(result)`,
    icon: BarChart3,
    outputTabs: ['console', 'dataframe', 'chart', 'statistics']
  },
  statistics: {
    name: "Statistics",
    template: `# Statistical Analysis
import pandas as pd
import numpy as np
import scipy.stats as stats
from scipy import stats

# Load dataset
df = pd.read_csv('sales_data.csv')

# Descriptive Statistics
numeric_cols = ['price', 'units_sold', 'revenue']

print("=== DESCRIPTIVE STATISTICS ===")
for col in numeric_cols:
    if col in df.columns:
        print(f"\\n{col.upper()}:")
        print(f"  Mean: {df[col].mean():.2f}")
        print(f"  Median: {df[col].median():.2f}")
        print(f"  Std Dev: {df[col].std():.2f}")
        print(f"  Min: {df[col].min()}")
        print(f"  Max: {df[col].max()}")

# Hypothesis Testing (Example)
print("\\n=== HYPOTHESIS TESTING ===")
electronics = df[df['category'] == 'Electronics']['price']
education = df[df['category'] == 'Education']['price']

if len(electronics) > 1 and len(education) > 1:
    t_stat, p_value = stats.ttest_ind(electronics, education)
    print(f"T-test (Electronics vs Education prices):")
    print(f"  t-statistic: {t_stat:.3f}")
    print(f"  p-value: {p_value:.3f}")
    print(f"  Significant difference: {'Yes' if p_value < 0.05 else 'No'}")`,
    icon: Calculator,
    outputTabs: ['console', 'statistics', 'tests']
  }
};

export function PracticeCodingInterfaceDynamic({
  exerciseId,
  questionId,
  initialCode = "",
  title,
  description,
  subjectType = 'python',
  onSubmit
}: {
  exerciseId: string;
  questionId: string;
  initialCode?: string;
  title: string;
  description: string;
  subjectType?: string;
  onSubmit?: (result: ExecutionResult) => void;
}) {
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'datasets' | 'editor' | 'results'>('editor');
  const [outputTab, setOutputTab] = useState<string>('console');
  const [stdout, setStdout] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Set initial code based on language
  useEffect(() => {
    if (selectedLanguage && LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG]) {
      setCode(initialCode || LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG].template);
    }
  }, [selectedLanguage, initialCode]);

  // Load programming languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response: ProgrammingLanguage[] = await apiPost('/v1/practice-coding/languages', {});
        setLanguages(response || []);
      } catch (error) {
        console.error('Failed to load languages:', error);
        setLanguages([
          { id: 'python', name: 'Python', version: '3.11', extension: 'py' },
          { id: 'sql', name: 'SQL', version: '3.36', extension: 'sql' },
          { id: 'r', name: 'R', version: '4.2', extension: 'r' },
          { id: 'statistics', name: 'Statistics', version: '1.0', extension: 'py' },
        ]);
      }
    };

    loadLanguages();
  }, []);

  // Load datasets for the question
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response: { datasets: Dataset[] } = await apiPost(`/v1/practice-coding/datasets/${questionId}`, {});
        setDatasets(response.datasets || []);
      } catch (error) {
        console.error('Failed to load datasets:', error);
        setDatasets([]);
      }
    };

    if (questionId) {
      loadDatasets();
    }
  }, [questionId]);

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const payload = {
        exercise_id: exerciseId,
        question_id: questionId,
        code: editorRef.current?.value || code,
        language: selectedLanguage,
        run_type: 'sample'
      };

      const result: ExecutionResult = await apiPost('/v1/practice-coding/execute', payload);
      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      if (result.passed) {
        toast.success('All tests passed!');
      } else {
        toast.error('Tests completed with issues');
      }
    } catch (error: any) {
      console.error('Execution failed:', error);
      toast.error('Execution failed: ' + (error.message || 'Unknown error'));
      setStdout(error.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  }, [exerciseId, questionId, code, selectedLanguage]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        exercise_id: exerciseId,
        question_id: questionId,
        code: editorRef.current?.value || code,
        language: selectedLanguage,
        run_type: 'submit'
      };

      const result: ExecutionResult = await apiPost('/v1/practice-coding/submit', payload);
      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      toast.success(`Submission successful! Score: ${result.score}/${result.total_points}`);
      onSubmit?.(result);
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseId, questionId, code, selectedLanguage, onSubmit]);

  const resetCode = () => {
    const template = LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG]?.template || code;
    setCode(template);
    if (editorRef.current) {
      editorRef.current.value = template;
    }
  };

  const currentConfig = LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG];
  const IconComponent = currentConfig?.icon || Code;

  // Dynamic tab configuration based on language
  const getTabConfig = () => {
    const baseTabs = ['problem', 'datasets', 'editor'];
    if (executionResult) baseTabs.push('results');
    return baseTabs;
  };

  // Use dedicated SQL interface when SQL is selected
  if (selectedLanguage === 'sql') {
    return (
      <SqlPracticeInterface
        exerciseId={exerciseId}
        questionId={questionId}
        initialCode={initialCode}
        title={title}
        description={description}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/10 to-indigo-50/20 rounded-xl overflow-hidden shadow-lg">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {IconComponent && <IconComponent className="h-6 w-6 text-blue-600" />}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-300"
              >
                {languages.map(lang => {
                  const config = LANGUAGE_CONFIG[lang.id as keyof typeof LANGUAGE_CONFIG];
                  const Icon = config?.icon;
                  return (
                    <option key={lang.id} value={lang.id}>
                      {config?.name || lang.name} ({lang.version})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedLanguage === 'sql' && (
              <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded border">
                 Tip: Use table name <code>sales_data</code> in queries
              </div>
            )}

            <button
              onClick={resetCode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset to template"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Execution Status */}
        {executionResult && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <span className={`flex items-center gap-1 font-semibold ${
                  executionResult.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {executionResult.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {executionResult.passed ? 'Passed' : 'Issues Found'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-600">Score:</span>
                <span className="font-bold text-blue-600">
                  {executionResult.score}/{executionResult.total_points}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {(executionResult.overall_result.execution_time).toFixed(0)}ms
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {(executionResult.overall_result.memory_used / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecute}
            disabled={isExecuting || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isExecuting ? (
              <Square className="h-4 w-4 animate-pulse" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <Square className="h-4 w-4 animate-pulse" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
          </button>
        </div>

        {selectedLanguage === 'statistics' && (
          <div className="text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-lg border">
           Statistical analysis results will appear in the Results tab
          </div>
        )}
      </div>

      {/* Dynamic Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {getTabConfig().map(tab => {
            const icons = {
              problem: BookOpen,
              datasets: Database,
              editor: Code,
              results: BarChart3
            };
            const Icon = icons[tab as keyof typeof icons] || Code;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area with Dynamic Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-2">
          {/* Left Panel */}
          <div className="border-r border-gray-200 overflow-y-auto">
            {activeTab === 'problem' && (
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Problem Statement
                  </h3>
                  <div className="text-gray-700 leading-relaxed mb-6">
                    {description || 'Solve this coding challenge using the specified language and available datasets.'}
                  </div>

                  {selectedLanguage === 'sql' && datasets.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2"> SQL Schema</h4>
                      <div className="font-mono text-sm text-blue-800">
                        <div>Table: <code>{datasets[0].table_name || 'sales_data'}</code></div>
                        <div>Columns: {datasets[0].columns?.join(', ') || 'Loading...'}</div>
                        <div>Records: {datasets[0].record_count || 'Loading...'}</div>
                      </div>
                    </div>
                  )}

                  {selectedLanguage === 'statistics' && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2"> Analysis Requirements</h4>
                      <ul className="text-purple-800 text-sm space-y-1">
                        <li> Perform descriptive statistics on numeric variables</li>
                        <li> Conduct appropriate hypothesis tests</li>
                        <li> Generate summary reports with insights</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'datasets' && (
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Datasets ({datasets.length})
                </h3>

                {datasets.map((dataset, index) => (
                  <div key={index} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        {dataset.name}
                      </h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {dataset.record_count?.toLocaleString() || 0} rows
                      </span>
                    </div>

                    {dataset.data_preview && dataset.data_preview.length > 0 && (
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-700">Data Preview</h5>
                          <span className="text-xs text-gray-500">
                            Showing first 3 of {dataset.record_count || dataset.data_preview.length} rows
                          </span>
                        </div>

                        <div className="overflow-x-auto border rounded">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                {(dataset.columns || Object.keys(dataset.data_preview[0] || {})).map(col => (
                                  <th key={col} className="border border-gray-300 px-3 py-2 font-medium text-left">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataset.data_preview.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {Object.values(row).map((value, colIndex) => {
                                    const displayValue = formatDatasetValue(value);
                                    return (
                                      <td key={colIndex} className="border border-gray-300 px-3 py-2 text-gray-700">
                                        <span className="block max-w-24 truncate" title={displayValue}>
                                          {displayValue}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {selectedLanguage === 'sql' && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">
                               <strong>SQL Usage:</strong> Reference this table as <code>{dataset.table_name || dataset.name.replace('.csv', '')}</code> in your queries.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {datasets.length === 0 && (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No datasets available for this exercise</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-600" />
                    Code Editor
                  </h3>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </button>
                </div>

                {/* Code Editor */}
                <div className="flex-1 border rounded-lg overflow-hidden">
                  <textarea
                    ref={editorRef}
                    defaultValue={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`w-full h-full p-4 font-mono text-sm border-none outline-none resize-none ${
                      selectedLanguage === 'sql' ? 'bg-blue-900 text-blue-100' :
                      selectedLanguage === 'python' ? 'bg-gray-900 text-green-400' :
                      selectedLanguage === 'r' ? 'bg-indigo-900 text-indigo-100' :
                      selectedLanguage === 'statistics' ? 'bg-purple-900 text-purple-100' :
                      'bg-gray-900 text-green-400'
                    }`}
                    placeholder={`Write your ${LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG]?.name || 'code'} here...`}
                    spellCheck={false}
                  />
                </div>

                {showAdvanced && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <h5 className="font-medium mb-2">Advanced Settings</h5>
                    <div className="text-sm text-gray-600">
                      {selectedLanguage === 'sql' && (
                        <p>💡 <strong>SQL:</strong> Queries are executed against the dataset tables. Use column names exactly as shown.</p>
                      )}
                      {selectedLanguage === 'python' && (
                        <p>🐍 <strong>Python:</strong> Access datasets using pandas. Example: <code>df = pd.read_csv(&apos;dataset.csv&apos;)</code></p>
                      )}
                      {selectedLanguage === 'r' && (
                        <p>📊 <strong>R:</strong> Use built-in tidyverse functions. Example: <code>df &lt;- read.csv(&apos;dataset.csv&apos;)</code></p>
                      )}
                      {selectedLanguage === 'statistics' && (
                        <p>📈 <strong>Statistics:</strong> Use scipy, numpy, and statsmodels for comprehensive statistical analysis.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Dynamic Output */}
          <div className="overflow-y-auto bg-gray-50">
            {activeTab === 'results' && executionResult && currentConfig?.outputTabs && (
              <div className="h-full">
                {/* Output Tabs */}
                <div className="border-b border-gray-200 bg-white">
                  <div className="flex px-4 py-2">
                    {currentConfig.outputTabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setOutputTab(tab)}
                        className={`px-3 py-1 mx-1 text-sm font-medium rounded transition-colors ${
                          outputTab === tab
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 h-full">
                  {outputTab === 'console' && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Console Output</h3>
                        <pre className="text-xs text-gray-500">
                          Time: {executionResult.overall_result.execution_time}ms |
                          Memory: {(executionResult.overall_result.memory_used / 1024).toFixed(1)} MB
                        </pre>
                      </div>
                      <pre className={`text-sm font-mono p-4 rounded-md whitespace-pre-wrap min-h-[300px] ${
                        executionResult.passed
                          ? 'bg-green-900 text-green-100'
                          : 'bg-red-900 text-red-100'
                      }`}>
                        {stdout || 'No output available'}
                      </pre>

                      {executionResult.overall_result.stderr && (
                        <div className="mt-4">
                          <h4 className="text-lg font-semibold text-red-700 mb-2">Error Output</h4>
                          <pre className="text-sm font-mono bg-red-50 text-red-800 p-4 rounded-md whitespace-pre-wrap">
                            {executionResult.overall_result.stderr}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {outputTab === 'table' && executionResult?.sql_results && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Table className="h-5 w-5 text-blue-600" />
                        Query Results
                      </h3>

                      {executionResult.sql_results.length > 0 ? (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                          <table className="min-w-full text-sm">
                            <thead className="bg-blue-50">
                              <tr>
                                {Object.keys(executionResult.sql_results[0]).map(col => (
                                  <th key={col} className="border border-blue-200 px-4 py-2 font-medium text-left">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {executionResult.sql_results.slice(0, 20).map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {Object.values(row).map((value, j) => (
                                    <td key={j} className="border border-gray-200 px-4 py-2">
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {executionResult.sql_results.length > 20 && (
                            <div className="p-3 bg-blue-50 border-t text-sm text-blue-700">
                              Showing first 20 rows of {executionResult.sql_results.length} total results
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No table results available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {outputTab === 'chart' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Data Visualization
                      </h3>
                      <div className="bg-white rounded-lg p-8 text-center shadow">
                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Chart visualization will appear here based on your code output</p>
                        <p className="text-sm text-gray-500 mt-2">
                          (Charts will be generated from analyzed data in Python/R scripts)
                        </p>
                      </div>
                    </div>
                  )}

                  {outputTab === 'statistics' && executionResult?.statistical_results && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-purple-600" />
                        Statistical Analysis
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(executionResult.statistical_results).map(([metric, value]) => (
                          <div key={metric} className="bg-white p-4 rounded-lg shadow">
                            <h4 className="font-semibold text-purple-900 capitalize">{metric.replace(/_/g, ' ')}</h4>
                            <p className="text-lg font-mono text-purple-700 mt-2">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!executionResult || activeTab !== 'results') && (
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-30">
                    {selectedLanguage === 'sql' ? '' :
                     selectedLanguage === 'python' ? '' :
                     selectedLanguage === 'r' ? '' :
                     selectedLanguage === 'statistics' ? '' : ''}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG]?.name || 'Code'} Ready
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click "Run Code" to execute your {LANGUAGE_CONFIG[selectedLanguage as keyof typeof LANGUAGE_CONFIG]?.name || 'code'}.
                  </p>

                  {selectedLanguage === 'sql' && datasets.length > 0 && (
                    <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">SQL Setup</h4>
                      <p className="text-sm text-blue-800">
                        Your query will be executed against the {datasets[0].name} table with {datasets[0].record_count} rows.
                      </p>
                    </div>
                  )}

                  {selectedLanguage === 'statistics' && (
                    <div className="max-w-md mx-auto bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Analysis Tools</h4>
                      <p className="text-sm text-purple-800">
                        Available: NumPy, Pandas, SciPy, StatsModels for comprehensive statistical analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
