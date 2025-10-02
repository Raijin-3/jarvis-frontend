"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import {
  PlayCircle,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  RotateCcw,
  Settings,
  Database,
  Table,
  FileSpreadsheet
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

type ProgrammingLanguage = {
  id: string;
  name: string;
  version: string;
  extension: string;
};

const DEFAULT_CODE_TEMPLATES: Record<string, string> = {
  python: `# Write your Python solution here
def solution():
    # Your code goes here
    pass

if __name__ == "__main__":
    solution()`,
  javascript: `// Write your JavaScript solution here
function solution() {
    // Your code goes here
}

solution();`,
  sql: `-- Write your SQL solution here
SELECT * FROM users;`,
  r: `# Write your R solution here
# Your code goes here

solution <- function() {
  # Implement your solution
}

# Call your function
solution()
`
};

interface Dataset {
  id: string;
  name: string;
  subject_type: 'sql' | 'python' | 'excel' | 'statistics' | 'r' | 'javascript';
  file_url?: string;
  data_preview?: any[];
  schema?: any;
  record_count?: number;
  columns?: string[];
}

export function PracticeCodingInterface({
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
  const [code, setCode] = useState<string>(initialCode || DEFAULT_CODE_TEMPLATES.python);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'datasets' | 'test-cases' | 'editor'>('editor');
  const [stdin, setStdin] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [templates, setTemplates] = useState<Record<string, string>>({});

  // Code editor ref
  const editorRef = useRef<HTMLTextAreaElement>(null);

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
          { id: 'javascript', name: 'JavaScript', version: '18', extension: 'js' },
        ]);
      }
    };

    loadLanguages();
  }, []);

  // Load test cases for the question
  useEffect(() => {
    const loadTestCases = async () => {
      try {
        const response: TestCase[] = await apiPost(`/v1/practice-coding/test-cases/${questionId}`, {});
        setTestCases(response || []);
      } catch (error) {
        console.error('Failed to load test cases:', error);
        // Sample test cases for demo
        setTestCases([
          { input: '2\n3', expected_output: '5', points: 1 },
          { input: '10\n20', expected_output: '30', points: 1 }
        ]);
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

  // Load subject-specific templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response: Record<string, string> = await apiPost(`/v1/practice-coding/templates/${subjectType}`, {});
        setTemplates(response || {});
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates(DEFAULT_CODE_TEMPLATES);
      }
    };

    if (subjectType) {
      loadTemplates();
    }
  }, [subjectType]);

  // Update code when language changes
  useEffect(() => {
    if (languages.length > 0) {
      const template = templates[selectedLanguage] || DEFAULT_CODE_TEMPLATES[selectedLanguage];
      if (template && (code === DEFAULT_CODE_TEMPLATES.python ||
                       code === DEFAULT_CODE_TEMPLATES.javascript ||
                       code === DEFAULT_CODE_TEMPLATES.sql)) {
        setCode(template);
        if (editorRef.current) {
          editorRef.current.value = template;
        }
      }
    }
  }, [selectedLanguage, languages, code, templates]);

  const handleExecute = useCallback(async () => {
    if (isExecuting || isSubmitting) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const payload = {
        exercise_id: exerciseId,
        question_id: questionId,
        code: editorRef.current?.value || code,
        language: selectedLanguage,
        test_cases: testCases,
        run_type: 'sample'
      };

      const result: ExecutionResult = await apiPost('/v1/practice-coding/execute', payload);
      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      // Show toast notification
      if (result.passed) {
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
  }, [exerciseId, questionId, code, selectedLanguage, testCases, isExecuting, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (isExecuting || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        exercise_id: exerciseId,
        question_id: questionId,
        code: editorRef.current?.value || code,
        language: selectedLanguage,
        test_cases: testCases,
        run_type: 'submit'
      };

      const result: ExecutionResult = await apiPost('/v1/practice-coding/submit', payload);

      setExecutionResult(result);
      setStdout(result.overall_result.stdout);

      if (result.passed) {
        toast.success(`Submission successful! Score: ${result.score}/${result.total_points}`);
      } else {
        toast.error(`Submission failed. Score: ${result.score}/${result.total_points}`);
      }

      // Notify parent component
      onSubmit?.(result);
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseId, questionId, code, selectedLanguage, testCases, isExecuting, isSubmitting, onSubmit]);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // Reset execution state
    setExecutionResult(null);
    setStdout('');
  };

  const resetCode = () => {
    const template = DEFAULT_CODE_TEMPLATES[selectedLanguage];
    if (template) {
      setCode(template);
      if (editorRef.current) {
        editorRef.current.value = template;
      }
    }
    setExecutionResult(null);
    setStdout('');
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
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.version})
                </option>
              ))}
            </select>

            {/* Reset Code */}
            <button
              onClick={resetCode}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Reset code"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Run Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <Square className="h-4 w-4 animate-pulse" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isExecuting ? 'Running...' : 'Run Tests'}
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isExecuting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Square className="h-4 w-4 animate-pulse" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
        </div>

        {/* Test Results Summary */}
        {executionResult && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Tests Passed:</span>
              <span className={`font-semibold ${executionResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {passedTests}/{totalTests}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Score:</span>
              <span className={`font-semibold ${executionResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {executionResult.score}/{executionResult.total_points}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {(executionResult.overall_result.execution_time / 1000).toFixed(2)}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('problem')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'problem'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'datasets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="h-4 w-4 inline mr-1" />
            Datasets ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Code Editor
          </button>
          <button
            onClick={() => setActiveTab('test-cases')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'test-cases'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Test Cases ({testCases.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-2">
          {/* Left Panel */}
          <div className="border-r border-gray-200 overflow-y-auto">
            {activeTab === 'problem' && (
              <div className="p-4">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-3">Problem Statement</h3>
                  <div className="text-gray-700 leading-relaxed">
                    {description || 'Solve this coding challenge by implementing the required function or solution.'}
                  </div>

                  {/* Input/Output Examples */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Examples</h4>
                    {testCases.filter(tc => !tc.is_hidden).slice(0, 2).map((tc, index) => (
                      <div key={index} className="mb-4 p-3 bg-gray-100 rounded-md">
                        <div className="text-sm">
                          <div className="text-green-700 font-medium">Input:</div>
                          <pre className="ml-2 text-gray-800">{tc.input || 'None'}</pre>
                          <div className="text-blue-700 font-medium mt-2">Output:</div>
                          <pre className="ml-2 text-gray-800">{tc.expected_output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="p-4 h-full">
                <div className="h-full border rounded-md overflow-hidden">
                  <textarea
                    ref={editorRef}
                    defaultValue={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
                    placeholder="Write your code here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {activeTab === 'test-cases' && (
              <div className="p-4 space-y-3">
                <h3 className="text-lg font-semibold">Test Cases</h3>
                {testCases.map((tc, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Test Case {index + 1}
                      </span>
                      {tc.is_hidden && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Hidden
                        </span>
                      )}
                      {executionResult?.test_results?.[index] && (
                        <>
                          {executionResult.test_results[index].passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {!tc.is_hidden && (
                        <>
                          <div>
                            <span className="font-medium text-gray-600">Input:</span>
                            <pre className="ml-2 mt-1 p-2 bg-gray-100 rounded text-gray-900">{tc.input}</pre>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Expected Output:</span>
                            <pre className="ml-2 mt-1 p-2 bg-gray-100 rounded text-gray-900">{tc.expected_output}</pre>
                          </div>
                        </>
                      )}

                      {executionResult?.test_results?.[index]?.actual_output && (
                        <div>
                          <span className="font-medium text-gray-600">Your Output:</span>
                          <pre className={`ml-2 mt-1 p-2 rounded ${executionResult.test_results[index].passed ? 'bg-green-100' : 'bg-red-100'}`}>
                            {executionResult.test_results[index].actual_output}
                          </pre>
                        </div>
                      )}

                      {executionResult?.test_results?.[index]?.error_message && (
                        <div className="text-red-700 bg-red-50 p-2 rounded">
                          <span className="font-medium">Error:</span> {executionResult.test_results[index].error_message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Output */}
          <div className="overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Output</h3>
              <pre className="text-sm font-mono bg-gray-900 text-green-400 p-4 rounded-md whitespace-pre-wrap min-h-[200px]">
                {stdout || 'Run your code to see output here...'}
              </pre>

              {executionResult?.overall_result.stderr && (
                <>
                  <h4 className="font-semibold mt-4 mb-2 text-red-600">Errors</h4>
                  <pre className="text-sm font-mono bg-red-50 text-red-800 p-4 rounded-md whitespace-pre-wrap">
                    {executionResult.overall_result.stderr}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
