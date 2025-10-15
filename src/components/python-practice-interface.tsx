"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { usePyodide } from "@/hooks/use-pyodide";
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Database,
  Code,
  FileSpreadsheet,
  Loader2
} from "lucide-react";

type TestCase = {
  id?: string;
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
  test_results: TestCase[];
  overall_result: {
    stdout: string;
    stderr: string;
    execution_time: number;
    memory_used: number;
    exit_code: number;
  };
  attempt_id?: string;
};

type DatasetCellValue = string | number | boolean | null;
type DatasetRow = Record<string, DatasetCellValue>;

interface DatasetSchemaInfo {
  dataset_rows?: unknown;
  dataset_columns?: unknown;
  dataset_table_name?: string;
  table_name?: string;
  dataset_csv_raw?: string;
  [key: string]: unknown;
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
  subject_type: 'python';
  file_url?: string;
  data_preview?: DatasetRow[];
  schema?: DatasetSchemaInfo;
  schema_info?: DatasetSchemaInfo;
  record_count?: number;
  columns?: string[];
  table_name?: string;
  data?: DatasetRow[];
  dataset_csv_raw?: string;
}

const sanitizeTableName = (name?: string): string => {
  const fallback = "dataset";
  if (!name) return fallback;
  const sanitized = name
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const candidate = sanitized || fallback;
  return /^[a-z_]/.test(candidate) ? candidate : `data_${candidate}`;
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values.map((value) => value.replace(/^"(.*)"$/, "$1"));
};

const parseCsvToObjects = (csv: string): DatasetRow[] => {
  const trimmed = csv?.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const entry: DatasetRow = {};
    headers.forEach((header, idx) => {
      entry[header] = cells[idx] ?? "";
    });
    return entry;
  });
};

const DEFAULT_PYTHON_TEMPLATE = `# Python Practice Exercise
# Write your Python code below

# You can use pandas for data analysis
# import pandas as pd

# Your solution here
def solution():
    # Your code goes here
    pass

# Test your solution
if __name__ == "__main__":
    solution()
`;

const getErrorMessage = (error: unknown, fallback = 'Execution failed'): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

const formatDatasetValue = (value: DatasetCellValue): string => {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

export function PythonPracticeInterface({
  exerciseId,
  questionId,
  initialCode = "",
  title,
  description,
  onSubmit
}: {
  exerciseId: string;
  questionId: string;
  initialCode?: string;
  title: string;
  description: string;
  onSubmit?: (result: ExecutionResult) => void;
}) {
  const [code, setCode] = useState<string>(initialCode || DEFAULT_PYTHON_TEMPLATE);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'editor' | 'results' | 'datasets'>('editor');
  const [stdout, setStdout] = useState<string>('');
  const [datasetsLoaded, setDatasetsLoaded] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Pyodide
  const {
    isReady: pyodideReady,
    isLoading: pyodideLoading,
    error: pyodideError,
    executeCode,
    loadPackage,
    loadDataFrame,
    reset: resetPyodide
  } = usePyodide();

  // Load test cases for the question
  useEffect(() => {
    const loadTestCases = async () => {
      try {
        const response: TestCase[] = await apiPost(`/v1/practice-coding/test-cases/${questionId}`, {});
        setTestCases(response || []);
      } catch (error) {
        console.error('Failed to load test cases:', error);
        setTestCases([]);
      }
    };

    if (questionId) {
      loadTestCases();
    }
  }, [questionId]);

  // Load datasets for the question
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response: { datasets: Dataset[] } = await apiPost(`/v1/practice-coding/datasets/${questionId}`, {});
        const usedTableNames = new Set<string>();
        const getUniqueTableName = (preferred?: string, fallbackSuffix?: number) => {
          const baseName = sanitizeTableName(preferred) || `data_dataset_${fallbackSuffix ?? ""}`.replace(/_+$/, "");
          let candidate = baseName;
          let counter = 1;
          while (usedTableNames.has(candidate)) {
            candidate = `${baseName}_${counter++}`;
          }
          usedTableNames.add(candidate);
          return candidate;
        };

        const normalized = Array.isArray(response.datasets)
          ? response.datasets.map((dataset, index) => {
              const schemaInfo = (dataset?.schema_info ?? dataset?.schema ?? {}) as DatasetSchemaInfo;
              const csvRaw = dataset?.dataset_csv_raw ?? schemaInfo?.dataset_csv_raw ?? "";
              const schemaRows = schemaInfo?.dataset_rows;
              const schemaColumns = schemaInfo?.dataset_columns;
              const resolvedData =
                Array.isArray(dataset?.data) && dataset.data.length > 0
                  ? dataset.data
                  : Array.isArray(schemaRows)
                  ? (schemaRows as DatasetRow[])
                  : csvRaw
                  ? parseCsvToObjects(csvRaw)
                  : [];
              const resolvedColumns =
                Array.isArray(dataset?.columns) && dataset.columns.length > 0
                  ? dataset.columns
                  : Array.isArray(schemaColumns)
                  ? (schemaColumns as string[])
                  : resolvedData.length > 0
                  ? Object.keys(resolvedData[0])
                  : [];
              const preferredTableName =
                dataset?.table_name ||
                schemaInfo?.dataset_table_name ||
                schemaInfo?.table_name ||
                dataset?.name ||
                `dataset_${index + 1}`;

              return {
                ...dataset,
                data: resolvedData,
                columns: resolvedColumns,
                table_name: getUniqueTableName(preferredTableName, index + 1),
                dataset_csv_raw: csvRaw || undefined,
              };
            })
          : [];
        setDatasets(normalized);
        setDatasetsLoaded(false);
      } catch (error) {
        console.error('Failed to load datasets:', error);
        setDatasets([]);
        setDatasetsLoaded(false);
      }
    };

    if (questionId) {
      loadDatasets();
    }
  }, [questionId]);

  // Load datasets into Pyodide when ready
  useEffect(() => {
    const initializeDatasets = async () => {
      if (!pyodideReady || datasets.length === 0 || datasetsLoaded) return;

      try {
        // Load pandas if not already loaded
        const pandasLoaded = await loadPackage('pandas');
        if (!pandasLoaded) {
          throw new Error('Unable to load pandas package in Pyodide');
        }

        // Load each dataset as a pandas DataFrame
        let successfulLoads = 0;
        const failedDatasets: string[] = [];
        const loadedDatasetInfo: { name: string; rows: number; columns: string[] }[] = [];
        
        for (const dataset of datasets) {
          if (Array.isArray(dataset.data) && dataset.data.length > 0) {
            const varName = dataset.table_name || sanitizeTableName(dataset.name);
            const loaded = await loadDataFrame(varName, dataset.data);
            if (!loaded) {
              console.warn(`Failed to load dataset ${varName} into Pyodide.`);
              failedDatasets.push(varName);
            } else {
              successfulLoads += 1;
              loadedDatasetInfo.push({
                name: varName,
                rows: dataset.data.length,
                columns: dataset.columns || Object.keys(dataset.data[0] || {})
              });
            }
          } else if (dataset.dataset_csv_raw) {
            const parsed = parseCsvToObjects(dataset.dataset_csv_raw);
            if (parsed.length > 0) {
              const varName = dataset.table_name || sanitizeTableName(dataset.name);
              const loaded = await loadDataFrame(varName, parsed);
              if (!loaded) {
                console.warn(`Failed to load CSV dataset ${varName} into Pyodide.`);
                failedDatasets.push(varName);
              } else {
                successfulLoads += 1;
                loadedDatasetInfo.push({
                  name: varName,
                  rows: parsed.length,
                  columns: Object.keys(parsed[0] || {})
                });
              }
            }
          }
        }

        setDatasetsLoaded(true);

        // Pre-populate code editor with imports and dataset info
        if (loadedDatasetInfo.length > 0) {
          const preloadedCode = `import pandas as pd
import numpy as np

# Datasets loaded:
${loadedDatasetInfo.map(ds => `# - ${ds.name}: ${ds.rows} rows × ${ds.columns.length} columns`).join('\n')}
${loadedDatasetInfo.map(ds => `#   Columns: ${ds.columns.join(', ')}`).join('\n')}

# Write your code below:
def solution():
    # Your code here
    pass

# Test your solution
if __name__ == "__main__":
    solution()
`;
          setCode(preloadedCode);
          
          // Display dataset info in output
          const outputMessages = loadedDatasetInfo.map(ds => 
            `✓ Dataset '${ds.name}' loaded: ${ds.rows} rows × ${ds.columns.length} columns\n  Columns: ${ds.columns.join(', ')}`
          ).join('\n\n');
          
          setStdout(`📊 Datasets loaded successfully!\n\n${outputMessages}\n\nYou can now use these DataFrames in your Python code.`);
        }

        if (successfulLoads > 0 && failedDatasets.length === 0) {
          toast.success('Datasets loaded successfully');
        } else if (successfulLoads > 0) {
          toast(`Loaded ${successfulLoads} dataset(s), but failed to load: ${failedDatasets.join(', ')}`);
        } else if (failedDatasets.length > 0) {
          toast.error('Failed to load datasets into Python environment');
        } else {
          toast('Datasets fetched, but no rows were provided to load into Python');
        }
      } catch (error) {
        console.error('Failed to initialize datasets:', error);
        toast.error('Failed to load datasets into Python environment');
        setDatasetsLoaded(true);
      }
    };

    initializeDatasets();
  }, [pyodideReady, datasets, datasetsLoaded, loadPackage, loadDataFrame]);

  // Execute code against test cases
  const executeAgainstTestCases = useCallback(async (userCode: string): Promise<TestCase[]> => {
    const results: TestCase[] = [];

    for (const testCase of testCases) {
      try {
        const startTime = performance.now();

        // Prepare code with test case input
        let executionCode = userCode;
        
        // If there's input, we need to mock stdin
        if (testCase.input) {
          executionCode = `
import sys
from io import StringIO

# Mock stdin with test input
sys.stdin = StringIO('''${testCase.input}''')

${userCode}
`;
        }

        const result = await executeCode(executionCode);
        const endTime = performance.now();

        const actualOutput = result.output?.trim() || '';
        const expectedOutput = testCase.expected_output.trim();
        const errorMessage = result.error || '';

        // Validate output
        const passed = validateOutput(actualOutput, expectedOutput);

        results.push({
          ...testCase,
          actual_output: actualOutput,
          passed,
          execution_time: endTime - startTime,
          exit_code: result.success ? 0 : 1,
          error_message: errorMessage,
        });
      } catch (error) {
        results.push({
          ...testCase,
          actual_output: '',
          passed: false,
          execution_time: 0,
          exit_code: -1,
          error_message: getErrorMessage(error),
        });
      }
    }

    return results;
  }, [testCases, executeCode]);

  // Validate output
  const validateOutput = (actualOutput: string, expectedOutput: string): boolean => {
    const normalize = (str: string) =>
      str.replace(/\s+/g, ' ').trim().toLowerCase();

    return normalize(actualOutput) === normalize(expectedOutput);
  };

  // Calculate score
  const calculateScore = (testResults: TestCase[]): {
    score: number;
    totalPoints: number;
    passed: boolean;
  } => {
    let totalPoints = 0;
    let earnedPoints = 0;
    let allPassed = true;

    for (const result of testResults) {
      const points = result.points || 1;
      totalPoints += points;

      if (result.passed) {
        earnedPoints += points;
      } else {
        allPassed = false;
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      score: Math.round(score * 100) / 100,
      totalPoints,
      passed: allPassed,
    };
  };

  // Handle code execution (Run button)
  const handleExecute = useCallback(async () => {
    if (isExecuting || isSubmitting || !pyodideReady) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setStdout('');

    try {
      const userCode = editorRef.current?.value || code;

      // If no test cases, just run the code
      if (testCases.length === 0) {
        const result = await executeCode(userCode);
        setStdout(result.output || result.error || 'Code executed');
        
        if (result.success) {
          toast.success('Code executed successfully');
        } else {
          toast.error('Execution failed');
        }
        
        setIsExecuting(false);
        return;
      }

      // Execute against test cases
      const testResults = await executeAgainstTestCases(userCode);
      const { score, totalPoints, passed } = calculateScore(testResults);

      const result: ExecutionResult = {
        success: true,
        passed,
        score,
        total_points: totalPoints,
        test_results: testResults,
        overall_result: {
          stdout: testResults[0]?.actual_output || '',
          stderr: testResults[0]?.error_message || '',
          execution_time: testResults.reduce((sum, t) => sum + (t.execution_time || 0), 0),
          memory_used: 0,
          exit_code: testResults[0]?.exit_code || 0,
        },
      };

      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      if (passed) {
        toast.success('All test cases passed!');
      } else {
        toast.error('Some test cases failed');
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown error');
      console.error('Execution failed:', error);
      toast.error('Execution failed: ' + message);
      setStdout(message);
    } finally {
      setIsExecuting(false);
    }
  }, [code, testCases, pyodideReady, isExecuting, isSubmitting, executeCode, executeAgainstTestCases]);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (isExecuting || isSubmitting || !pyodideReady) return;

    setIsSubmitting(true);

    try {
      const userCode = editorRef.current?.value || code;

      // Execute against all test cases (including hidden ones)
      const testResults = await executeAgainstTestCases(userCode);
      const { score, totalPoints, passed } = calculateScore(testResults);

      const result: ExecutionResult = {
        success: true,
        passed,
        score,
        total_points: totalPoints,
        test_results: testResults,
        overall_result: {
          stdout: testResults[0]?.actual_output || '',
          stderr: testResults[0]?.error_message || '',
          execution_time: testResults.reduce((sum, t) => sum + (t.execution_time || 0), 0),
          memory_used: 0,
          exit_code: testResults[0]?.exit_code || 0,
        },
      };

      // Save to backend
      const savePayload = {
        exercise_id: exerciseId,
        question_id: questionId,
        code: userCode,
        language: 'python',
        test_results: testResults,
        score,
        passed,
        execution_time: result.overall_result.execution_time,
      };

      const savedResult = await apiPost('/v1/practice-coding/save-attempt', savePayload);
      result.attempt_id = savedResult.attempt_id;

      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      if (passed) {
        toast.success(`Submission successful! Score: ${score}/${totalPoints}`);
      } else {
        toast.error(`Submission failed. Score: ${score}/${totalPoints}`);
      }

      // Notify parent component
      onSubmit?.(result);
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown error');
      console.error('Submission failed:', error);
      toast.error('Submission failed: ' + message);
      setExecutionResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseId, questionId, code, pyodideReady, isExecuting, isSubmitting, onSubmit, executeAgainstTestCases]);

  // Reset code
  const resetCode = () => {
    setCode(DEFAULT_PYTHON_TEMPLATE);
    if (editorRef.current) {
      editorRef.current.value = DEFAULT_PYTHON_TEMPLATE;
    }
    setExecutionResult(null);
    setStdout('');
  };

  // Reset environment
  const handleResetEnvironment = async () => {
    try {
      await resetPyodide();
      setDatasetsLoaded(false);
      toast.success('Python environment reset');
    } catch (error) {
      console.error('Failed to reset environment:', error);
      toast.error('Failed to reset environment');
    }
  };

  const passedTests = executionResult?.test_results?.filter(test => test.passed).length || 0;
  const totalTests = executionResult?.test_results?.length || testCases.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pyodide Status */}
            <div className="flex items-center gap-2 text-sm">
              {pyodideLoading && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading Python...
                </span>
              )}
              {pyodideReady && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Python Ready
                </span>
              )}
              {pyodideError && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Python Error
                </span>
              )}
            </div>

            {/* Reset Environment */}
            <button
              onClick={handleResetEnvironment}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Reset Python environment"
              disabled={!pyodideReady}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('problem')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'problem'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="inline h-4 w-4 mr-1" />
            Problem
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="inline h-4 w-4 mr-1" />
            Editor
          </button>
          {datasets.length > 0 && (
            <button
              onClick={() => setActiveTab('datasets')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'datasets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="inline h-4 w-4 mr-1" />
              Datasets ({datasets.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="inline h-4 w-4 mr-1" />
            Results {executionResult && `(${passedTests}/${totalTests})`}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Problem Tab */}
        {activeTab === 'problem' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Problem Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
            </div>

            {testCases.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3">Sample Test Cases</h4>
                <div className="space-y-3">
                  {testCases.filter(tc => !tc.is_hidden).map((tc, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Input:</p>
                          <pre className="text-sm bg-white p-2 rounded border">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Expected Output:</p>
                          <pre className="text-sm bg-white p-2 rounded border">{tc.expected_output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Python Editor</span>
              <button
                onClick={resetCode}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Reset Code
              </button>
            </div>
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
              placeholder="Write your Python code here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Datasets Tab */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            {datasets.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Available</h4>
                <p className="text-sm text-gray-600">
                  This exercise doesn't have any datasets attached yet.
                </p>
              </div>
            ) : (
              datasets.map((dataset) => (
              <div key={dataset.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{dataset.name}</h4>
                    {dataset.description && (
                      <p className="text-sm text-gray-600 mt-1">{dataset.description}</p>
                    )}
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-gray-400" />
                </div>

                {dataset.columns && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Columns:</p>
                    <div className="flex flex-wrap gap-1">
                      {dataset.columns.map((col, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {((dataset.data && dataset.data.length > 0) || (dataset.data_preview && dataset.data_preview.length > 0)) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Preview (first 5 rows):
                      {dataset.record_count && (
                        <span className="ml-2 text-gray-400">
                          Total: {dataset.record_count} rows
                        </span>
                      )}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys((dataset.data && dataset.data.length > 0 ? dataset.data : dataset.data_preview)[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(dataset.data && dataset.data.length > 0 ? dataset.data : dataset.data_preview).slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.values(row as Record<string, DatasetCellValue>).map((val, cellIdx) => {
                                const displayValue = formatDatasetValue(val);
                                return (
                                  <td key={cellIdx} className="px-3 py-2 text-gray-600">
                                    {displayValue}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Variable name: <code className="bg-gray-100 px-1 py-0.5 rounded">
                      {dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}
                    </code>
                  </div>
                  {dataset.data && dataset.data.length > 0 && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Loaded in Python
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {executionResult ? (
              <>
                {/* Overall Result */}
                <div className={`bg-white rounded-lg p-4 shadow-sm border-2 ${
                  executionResult.passed ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {executionResult.passed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <span className="font-semibold text-lg">
                        {executionResult.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {executionResult.score}/{executionResult.total_points}
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tests Passed:</span>
                      <span className="ml-2 font-medium">{passedTests}/{totalTests}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Execution Time:</span>
                      <span className="ml-2 font-medium">{executionResult.overall_result.execution_time.toFixed(2)}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Exit Code:</span>
                      <span className="ml-2 font-medium">{executionResult.overall_result.exit_code}</span>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                <div className="space-y-3">
                  {executionResult.test_results.map((test, idx) => (
                    <div
                      key={idx}
                      className={`bg-white rounded-lg p-4 shadow-sm border ${
                        test.passed ? 'border-green-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {test.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">Test Case {idx + 1}</span>
                          {test.is_hidden && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {test.execution_time?.toFixed(2)}ms
                          </span>
                          <span>{test.points || 1} pts</span>
                        </div>
                      </div>

                      {!test.is_hidden && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Input:</p>
                            <pre className="text-sm bg-gray-50 p-2 rounded border overflow-x-auto">
                              {test.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Expected Output:</p>
                            <pre className="text-sm bg-gray-50 p-2 rounded border overflow-x-auto">
                              {test.expected_output}
                            </pre>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Your Output:</p>
                            <pre className={`text-sm p-2 rounded border overflow-x-auto ${
                              test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              {test.actual_output || '(no output)'}
                            </pre>
                          </div>
                        </div>
                      )}

                      {test.error_message && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-red-600 mb-1">Error:</p>
                          <pre className="text-sm bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                            {test.error_message}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Output */}
                {stdout && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-medium mb-2">Console Output</h4>
                    <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {stdout}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg p-8 shadow-sm text-center text-gray-500">
                <PlayCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Run your code to see results</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {executionResult && (
              <div className="text-sm">
                <span className="text-gray-600">Score:</span>
                <span className="ml-2 font-semibold text-lg">
                  {executionResult.score}/{executionResult.total_points}
                </span>
                <span className="ml-2 text-gray-500">
                  ({passedTests}/{totalTests} tests passed)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecute}
              disabled={isExecuting || isSubmitting || !pyodideReady}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Run Code
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isExecuting || isSubmitting || !pyodideReady}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
