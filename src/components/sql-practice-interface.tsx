"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { useSQLite, SQLResult } from "@/hooks/useSQLite";
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
  Upload,
  Trash2
} from "lucide-react";

type TestCase = {
  id: string;
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
  sql_results?: SQLResult[];
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
  subject_type: 'sql';
  file_url?: string;
  data_preview?: any[];
  schema?: any;
  record_count?: number;
  columns?: string[];
  table_name?: string;
  data?: any[];
}

const DEFAULT_SQL_TEMPLATE = `-- SQLite Practice Exercise
-- Write your SQL queries below

-- Example: Basic SELECT query
-- SELECT * FROM sales_data LIMIT 5;

-- Your solution here
`;

export function SqlPracticeInterface({
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
  const [code, setCode] = useState<string>(initialCode || DEFAULT_SQL_TEMPLATE);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'editor' | 'results' | 'schema'>('editor');
  const [stdout, setStdout] = useState<string>('');
  const [showExpected, setShowExpected] = useState(false);
  const [currentDatabase, setCurrentDatabase] = useState<Uint8Array | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize SQLite WASM
  const {
    db,
    isLoading: dbLoading,
    error: dbError,
    execute: executeQuery,
    createTable,
    insertData,
    exportDatabase,
    importDatabase,
    resetDatabase
  } = useSQLite(currentDatabase || undefined);

  // Load datasets for the question
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response: { datasets: Dataset[] } = await apiPost(`/v1/practice-coding/datasets/${questionId}`, {});
        setDatasets(response.datasets || []);

        // If datasets exist, initialize the database with data
        if (response.datasets && response.datasets.length > 0) {
          await initializeDatabaseWithDatasets(response.datasets);
        }
      } catch (error) {
        console.error('Failed to load datasets:', error);
        setDatasets([]);
      }
    };

    if (questionId) {
      loadDatasets();
    }
  }, [questionId, db]);

  // Initialize database with dataset data
  const initializeDatabaseWithDatasets = async (datasets: Dataset[]) => {
    if (!db) return;

    try {
      for (const dataset of datasets) {
        if (dataset.data && dataset.data.length > 0) {
          const tableName = dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

          // Create table
          if (dataset.columns && dataset.columns.length > 0) {
            await createTable(tableName, dataset.columns);
          } else {
            await createTable(tableName, Object.keys(dataset.data[0]));
          }

          // Insert data
          await insertData(tableName, dataset.data);
        }
      }
    } catch (error) {
      console.error('Failed to initialize database with datasets:', error);
      toast.error('Failed to load dataset data');
    }
  };

  const handleExecute = useCallback(async () => {
    if (isExecuting || dbLoading) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setStdout('');

    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const sqlToExecute = editorRef.current?.value || code;
      const startTime = performance.now();

      // Execute SQL query
      const results = await executeQuery(sqlToExecute);
      const executionTime = performance.now() - startTime;

      // Format results for display
      let resultOutput = '';

      if (results.length > 0) {
        results.forEach((result, index) => {
          if (index > 0) resultOutput += '\n\n';
          resultOutput += `Query ${index + 1} Results:\n`;

          if (result.columns.length > 0) {
            // Display table header
            resultOutput += result.columns.join(' | ') + '\n';
            resultOutput += '-'.repeat(result.columns.join(' | ').length) + '\n';

            // Display table data (limit to first 20 rows for performance)
            const displayRows = result.values.slice(0, 20);
            displayRows.forEach(row => {
              resultOutput += row.map(cell => String(cell || 'NULL')).join(' | ') + '\n';
            });

            if (result.values.length > 20) {
              resultOutput += `... and ${result.values.length - 20} more rows\n`;
            }

            resultOutput += `\nTotal rows: ${result.values.length}`;
          } else {
            resultOutput += 'Query executed successfully (no results to display)';
          }
        });
      } else {
        resultOutput = 'Query executed successfully';
      }

      setStdout(resultOutput);

      // Create execution result for compatibility with existing interface
      const mockResult: ExecutionResult = {
        success: true,
        passed: true,
        score: 100,
        total_points: 100,
        test_results: [],
        sql_results: results,
        overall_result: {
          stdout: resultOutput,
          stderr: '',
          execution_time: executionTime,
          memory_used: 0,
          exit_code: 0
        }
      };

      setExecutionResult(mockResult);
      toast.success('Query executed successfully!');

    } catch (error: any) {
      console.error('SQL execution failed:', error);
      const errorMessage = error.message || 'Query failed to execute';
      setStdout(`Error: ${errorMessage}`);

      const mockResult: ExecutionResult = {
        success: false,
        passed: false,
        score: 0,
        total_points: 100,
        test_results: [],
        overall_result: {
          stdout: '',
          stderr: errorMessage,
          execution_time: 0,
          memory_used: 0,
          exit_code: 1
        }
      };

      setExecutionResult(mockResult);
      toast.error('Query execution failed');
    } finally {
      setIsExecuting(false);
    }
  }, [code, db, isExecuting, dbLoading, executeQuery]);

  const handleSubmit = useCallback(async () => {
    if (isExecuting || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // For SQL practice, we treat execution as submission
      const result = executionResult;

      if (!result) {
        toast.error('Please run your query first before submitting');
        return;
      }

      if (!result.passed) {
        toast.error('Query has errors. Please fix them before submitting');
        return;
      }

      toast.success('Solution submitted successfully!');
      onSubmit?.(result);
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [executionResult, isExecuting, isSubmitting, onSubmit]);

  const resetCode = () => {
    setCode(DEFAULT_SQL_TEMPLATE);
    if (editorRef.current) {
      editorRef.current.value = DEFAULT_SQL_TEMPLATE;
    }
    setExecutionResult(null);
    setStdout('');
  };

  const resetDatabaseInstance = async () => {
    try {
      await resetDatabase();
      setExecutionResult(null);
      setStdout('');

      // Re-initialize with datasets if they exist
      if (datasets.length > 0) {
        await initializeDatabaseWithDatasets(datasets);
      }

      toast.success('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      toast.error('Failed to reset database');
    }
  };

  const exportCurrentDatabase = () => {
    const data = exportDatabase();
    if (data) {
      // Create a new Uint8Array to avoid SharedArrayBuffer issues
      const arrayData = new Uint8Array(data);
      const blob = new Blob([arrayData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.sqlite';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Database exported successfully');
    } else {
      toast.error('No database to export');
    }
  };

  // Database error handling
  if (dbError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Initialization Failed</h3>
          <p className="text-gray-600 mb-4">{dbError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

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
            {/* Database Status */}
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-green-600" />
              <span className={dbLoading ? 'text-yellow-600' : db ? 'text-green-600' : 'text-red-600'}>
                {dbLoading ? 'Initializing...' : db ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Reset Database */}
            <button
              onClick={resetDatabaseInstance}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Reset database"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Export Database */}
            <button
              onClick={exportCurrentDatabase}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Export database"
            >
              <Download className="h-4 w-4" />
            </button>

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
              disabled={isExecuting || dbLoading || !db}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <Square className="h-4 w-4 animate-pulse" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isExecuting ? 'Running...' : 'Run Query'}
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isExecuting || !executionResult || !executionResult.passed}
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

        {/* Execution Status */}
        {executionResult && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Status:</span>
              <span className={`flex items-center gap-1 font-semibold ${
                executionResult.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {executionResult.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {executionResult.passed ? 'Success' : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {(executionResult.overall_result.execution_time).toFixed(2)}ms
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
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="h-4 w-4 inline mr-1" />
            Schema ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code className="h-4 w-4 inline mr-1" />
            SQL Editor
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Results
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
                    {description || 'Write SQL queries to solve this database problem. Use the available database tables to query and analyze the data.'}
                  </div>

                  {datasets.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2">Available Tables:</h4>
                      <ul className="space-y-1">
                        {datasets.map((dataset, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-600" />
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}
                            </code>
                            - {dataset.description || `${dataset.record_count || 0} records`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Database Schema</h3>

                {datasets.map((dataset, index) => (
                  <div key={index} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Table className="h-4 w-4 text-green-600" />
                        {dataset.table_name || dataset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {dataset.record_count?.toLocaleString() || 0} rows
                      </span>
                    </div>

                    {dataset.columns && dataset.columns.length > 0 && (
                      <div className="p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Columns:</h5>
                        <div className="space-y-1">
                          {dataset.columns.map((column, colIndex) => (
                            <div key={colIndex} className="flex items-center gap-2 text-sm">
                              <code className="bg-gray-100 px-2 py-1 rounded flex-1">
                                {column}
                              </code>
                              <span className="text-gray-500">TEXT</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dataset.data_preview && dataset.data_preview.length > 0 && (
                      <div className="p-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Sample Data</h5>
                          <span className="text-xs text-gray-500">
                            Showing first 3 of {dataset.record_count || dataset.data_preview.length} rows
                          </span>
                        </div>

                        <div className="overflow-x-auto border rounded">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                {(dataset.columns || Object.keys(dataset.data_preview[0] || {})).slice(0, 5).map(col => (
                                  <th key={col} className="border border-gray-300 px-3 py-2 font-medium text-left">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataset.data_preview.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {Object.values(row).slice(0, 5).map((value, colIndex) => (
                                    <td key={colIndex} className="border border-gray-300 px-3 py-2 text-gray-700">
                                      <span className="block max-w-24 truncate" title={String(value)}>
                                        {String(value)}
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
              <div className="p-4 h-full">
                <div className="h-full border rounded-md overflow-hidden">
                  <textarea
                    ref={editorRef}
                    defaultValue={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
                    placeholder="Write your SQL query here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="overflow-y-auto">
            {activeTab === 'results' && (
              <div className="p-4">
                <h3 className="font-semibold mb-3">Query Results</h3>
                <pre className="text-sm font-mono bg-gray-900 text-green-400 p-4 rounded-md whitespace-pre-wrap min-h-[200px] max-h-[600px] overflow-y-auto">
                  {stdout || 'Run your query to see results here...'}
                </pre>

                {executionResult?.sql_results && executionResult.sql_results.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {executionResult.sql_results.map((result, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b">
                          <h4 className="font-medium">Query {index + 1}</h4>
                        </div>
                        <div className="p-4">
                          {result.columns.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm border">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {result.columns.map((col, i) => (
                                      <th key={i} className="border px-4 py-2 font-medium text-left">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.values.slice(0, 20).map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      {row.map((cell, j) => (
                                        <td key={j} className="border px-4 py-2">
                                          {String(cell || 'NULL')}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {result.values.length > 20 && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Showing first 20 rows of {result.values.length} total rows
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-600 italic">Query executed successfully (no data returned)</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {executionResult?.overall_result.stderr && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-700 mb-2">Error Output</h4>
                    <pre className="text-sm font-mono bg-red-50 text-red-800 p-4 rounded-md whitespace-pre-wrap">
                      {executionResult.overall_result.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'results' && (
              <div className="p-4">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-30">
                    ???????
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {activeTab === 'problem' ? 'Problem Description' : 'SQL Editor Ready'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'problem'
                      ? 'Review the problem statement and available database tables.'
                      : 'Write and execute SQL queries using the editor tab.'
                    }
                  </p>

                  { datasets.length > 0 && (
                    <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Database Ready</h4>
                      <p className="text-sm text-blue-800">
                        {datasets.length} table{datasets.length !== 1 ? 's' : ''} loaded with sample data for practice.
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
