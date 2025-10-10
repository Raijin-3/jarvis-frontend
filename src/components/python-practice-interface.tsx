"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { usePyodide } from "@/hooks/use-pyodide";
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
  Code,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Download,
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

interface Dataset {
  id: string;
  name: string;
  description?: string;
  subject_type: 'python';
  file_url?: string;
  data_preview?: any[];
  schema?: any;
  record_count?: number;
  columns?: string[];
  table_name?: string;
  data?: any[];
}

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
  const [showExpected, setShowExpected] = useState(false);
  const [datasetsLoaded, setDatasetsLoaded] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Pyodide
  const {
    isReady: pyodideReady,
    isLoading: pyodideLoading,
    error: pyodideError,
    executeCode,
    loadPackage,
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

  // Load datasets into Pyodide when ready
  useEffect(() => {
    const initializeDatasets = async () => {
      if (!pyodideReady || datasets.length === 0 || datasetsLoaded) return;

      try {
        // Load pandas if not already loaded
        await loadPackage('pandas');

        // Load each dataset as a pandas DataFrame
        for (const dataset of datasets) {
          if (dataset.data && dataset.data.length > 0) {
            const varName = dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            
            // Convert data to JSON string
            const dataJson = JSON.stringify(dataset.data);
            
            // Create DataFrame in Pyodide
            const loadCode = `
import pandas as pd
import json

# Load dataset: ${dataset.name}
${varName}_data = json.loads('''${dataJson}''')
${varName} = pd.DataFrame(${varName}_data)
print(f"Loaded dataset '${varName}' with {len(${varName})} rows")
`;
            
            await executeCode(loadCode);
          }
        }

        setDatasetsLoaded(true);
        toast.success('Datasets loaded successfully');
      } catch (error) {
        console.error('Failed to initialize datasets:', error);
        toast.error('Failed to load datasets into Python environment');
      }
    };

    initializeDatasets();
  }, [pyodideReady, datasets, datasetsLoaded, loadPackage, executeCode]);

  // Execute code against test cases
  const executeAgainstTestCases = async (userCode: string): Promise<TestCase[]> => {
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
      } catch (error: any) {
        results.push({
          ...testCase,
          actual_output: '',
          passed: false,
          execution_time: 0,
          exit_code: -1,
          error_message: error.message || 'Execution failed',
        });
      }
    }

    return results;
  };

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
    } catch (error: any) {
      console.error('Execution failed:', error);
      toast.error('Execution failed: ' + (error.message || 'Unknown error'));
      setStdout(error.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  }, [code, testCases, pyodideReady, isExecuting, isSubmitting, executeCode]);

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
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseId, questionId, code, testCases, pyodideReady, isExecuting, isSubmitting, executeCode, onSubmit]);

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
            {datasets.map((dataset) => (
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

                {dataset.data_preview && dataset.data_preview.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 5 rows):</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(dataset.data_preview[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.data_preview.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.values(row).map((val: any, cellIdx) => (
                                <td key={cellIdx} className="px-3 py-2 text-gray-600">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  Variable name: <code className="bg-gray-100 px-1 py-0.5 rounded">
                    {dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}
                  </code>
                </div>
              </div>
            ))}
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