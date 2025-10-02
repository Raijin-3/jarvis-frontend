"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSQLite, SQLResult } from "@/hooks/useSQLite";
import { toast } from "@/lib/toast";
import { getExerciseById, generateDatabaseSchema, type PracticeExercise, type DatabaseTable } from "@/lib/sql-practice-generator";
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Database,
  Table,
  Lightbulb,
  Clock,
  User,
  ChevronRight,
  RotateCcw,
  Download,
  BookOpen,
  Target,
  HelpCircle
} from "lucide-react";

interface Exercise {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    exercise_id: string;
  }>;
}

interface SqlPracticeWorkspaceProps {
  exercise: Exercise;
}

const LESSON_PROGRESSION = [
  { id: '1', title: 'Introduction', current: true, completed: false },
  { id: '2', title: 'SQL in Data Analytics', current: false, completed: false },
  { id: '3', title: 'Sales Data Analysis', current: false, completed: false },
  { id: '4', title: 'SQL exercise', current: false, completed: false },
  { id: '5', title: 'Database and Data Types in SQL', current: false, completed: false },
  { id: '6', title: 'Data Definition Language', current: false, completed: false },
  { id: '7', title: 'Data Manipulation Language (DML)', current: false, completed: false },
  { id: '8', title: 'SQL Constraints', current: false, completed: false }
];

export function SqlPracticeWorkspace({ exercise }: SqlPracticeWorkspaceProps) {
  const [code, setCode] = useState(`→ Write your SQL query here
→ Example: SELECT * FROM table_name;

-- Your solution here
`);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<SQLResult[] | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [practiceExercise, setPracticeExercise] = useState<PracticeExercise | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Reset hint and solution when question changes
  useEffect(() => {
    setShowHint(false);
    setShowSolution(false);
  }, [currentQuestionIndex]);

  // Initialize SQLite WASM with sample data
  const {
    db,
    isLoading: dbLoading,
    error: dbError,
    execute: executeQuery,
    createTable,
    insertData,
    resetDatabase
  } = useSQLite();

  // Load practice exercise
  useEffect(() => {
    const loadPracticeExercise = async () => {
      // For demonstration, use the first sample exercise
      const sampleExercise = getExerciseById('sql-basics-1');
      if (sampleExercise) {
        setPracticeExercise(sampleExercise);
      }
    };

    loadPracticeExercise();
  }, [exercise.id]);

  // Initialize database with practice exercise tables
  useEffect(() => {
    const initializeDatabase = async () => {
      if (!db || !practiceExercise) return;

      try {
        // Generate and execute database schema
        const schema = generateDatabaseSchema(practiceExercise.tables);
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await executeQuery(statement.trim() + ';');
          }
        }
        
        toast.success('Database initialized with practice data');
      } catch (error: any) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to initialize database: ' + error.message);
      }
    };

    if (db && !dbLoading && practiceExercise) {
      initializeDatabase();
    }
  }, [db, dbLoading, practiceExercise, executeQuery]);

  const handleRunQuery = useCallback(async () => {
    if (isExecuting || dbLoading || !db) return;

    const query = editorRef.current?.value || code;
    if (!query.trim() || query.trim().startsWith('→')) {
      toast.error('Please write a SQL query first');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionError(null);

    try {
      const results = await executeQuery(query);
      setExecutionResult(results);
      toast.success('Query executed successfully!');
    } catch (error: any) {
      console.error('SQL execution failed:', error);
      setExecutionError(error.message);
      toast.error('Query execution failed: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  }, [code, db, isExecuting, dbLoading, executeQuery]);

  const handleSubmit = useCallback(async () => {
    if (!executionResult || executionError) {
      toast.error('Please run your query successfully first');
      return;
    }

    toast.success('Solution submitted successfully!');
  }, [executionResult, executionError]);

  const handleReset = useCallback(async () => {
    try {
      setCode(`→ Write your SQL query here
→ Example: SELECT * FROM table_name;

-- Your solution here
`);
      if (editorRef.current) {
        editorRef.current.value = `→ Write your SQL query here
→ Example: SELECT * FROM table_name;

-- Your solution here
`;
      }
      setExecutionResult(null);
      setExecutionError(null);
      toast.success('Code reset successfully');
    } catch (error) {
      toast.error('Failed to reset code');
    }
  }, []);

  if (dbError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Error</h3>
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
    <div className="h-full flex bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-blue-600 text-sm font-medium mb-2">SQL</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {practiceExercise?.title || exercise.title}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {practiceExercise?.description || exercise.description}
          </p>
        </div>

        {/* Current Question */}
        {practiceExercise && practiceExercise.questions.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-900">
                Question {currentQuestionIndex + 1} of {practiceExercise.questions.length}
              </div>
              <div className={`text-xs px-2 py-1 rounded ${
                practiceExercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                practiceExercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {practiceExercise.difficulty}
              </div>
            </div>
            
            <div className="text-sm text-gray-700 mb-4">
              {practiceExercise.questions[currentQuestionIndex]?.text}
            </div>

            <div className="flex gap-2">
              {practiceExercise.questions[currentQuestionIndex]?.hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
              {practiceExercise.questions[currentQuestionIndex]?.solution && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Target className="h-3 w-3" />
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
              )}
            </div>

            {/* Hint Display */}
            {showHint && practiceExercise.questions[currentQuestionIndex]?.hint && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <strong>Hint:</strong> {practiceExercise.questions[currentQuestionIndex].hint}
                  </div>
                </div>
              </div>
            )}

            {/* Solution Display */}
            {showSolution && practiceExercise.questions[currentQuestionIndex]?.solution && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-700 mb-2">
                  <strong>Solution:</strong>
                </div>
                <code className="text-xs bg-gray-100 p-2 rounded block font-mono">
                  {practiceExercise.questions[currentQuestionIndex].solution}
                </code>
                {practiceExercise.questions[currentQuestionIndex]?.explanation && (
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>Explanation:</strong> {practiceExercise.questions[currentQuestionIndex].explanation}
                  </div>
                )}
              </div>
            )}

            {/* Question Navigation */}
            {practiceExercise.questions.length > 1 && (
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(practiceExercise.questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === practiceExercise.questions.length - 1}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* SQL Editor */}
        <div className="flex-1 bg-white border-r border-gray-200 flex flex-col">
          {/* Editor Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">SQL EDITOR</div>
              <div className="flex items-center gap-2 text-xs">
                <Database className="h-4 w-4" />
                <span className={dbLoading ? 'text-yellow-400' : db ? 'text-green-400' : 'text-red-400'}>
                  {dbLoading ? 'Loading...' : db ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-gray-900">
            <textarea
              ref={editorRef}
              className="w-full h-full p-6 bg-gray-900 text-green-400 font-mono text-sm resize-none border-0 focus:outline-none"
              defaultValue={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your SQL query here..."
              style={{ 
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              title="Reset code"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleRunQuery}
              disabled={isExecuting || dbLoading}
              className="px-6 py-2 border border-gray-600 text-white hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Run
                </>
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!executionResult || !!executionError}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Query Results */}
        {(executionResult || executionError) && (
          <div className="h-64 border-t border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">Query Results</h3>
            </div>
            <div className="p-4 overflow-auto h-full">
              {executionError ? (
                <div className="text-red-600 font-mono text-sm">
                  Error: {executionError}
                </div>
              ) : executionResult && executionResult.length > 0 ? (
                <div className="space-y-4">
                  {executionResult.map((result, index) => (
                    <div key={index}>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Query {index + 1} Results:
                      </div>
                      {result.columns.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                {result.columns.map((col, colIndex) => (
                                  <th
                                    key={colIndex}
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {result.values.slice(0, 20).map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                                    >
                                      {cell !== null ? String(cell) : 'NULL'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {result.values.length > 20 && (
                            <div className="mt-2 text-xs text-gray-500">
                              ... and {result.values.length - 20} more rows
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-600">
                            Total rows: {result.values.length}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Query executed successfully (no results to display)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Query executed successfully
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Available Tables */}
        <div className="flex-1">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Available Tables</h3>
          </div>
          
          <div className="p-4 space-y-6">
            {practiceExercise?.tables.map((table) => (
              <div key={table.name}>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {table.displayName}
                </div>
                {table.description && (
                  <div className="text-xs text-gray-600 mb-2">
                    {table.description}
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className={`grid gap-2 text-xs font-medium text-gray-700 ${
                      table.columns.length === 2 ? 'grid-cols-2' :
                      table.columns.length === 3 ? 'grid-cols-3' :
                      table.columns.length === 4 ? 'grid-cols-4' :
                      'grid-cols-1'
                    }`}>
                      {table.columns.slice(0, 4).map((col) => (
                        <div key={col.name} className="truncate">
                          {col.name}
                          <span className="text-gray-500 ml-1">
                            ({col.type})
                          </span>
                        </div>
                      ))}
                      {table.columns.length > 4 && (
                        <div className="text-gray-500">+{table.columns.length - 4} more</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Table Data */}
                  <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                    {table.data.slice(0, 10).map((row, rowIndex) => (
                      <div key={rowIndex} className="px-3 py-2">
                        <div className={`grid gap-2 text-xs text-gray-900 ${
                          table.columns.length === 2 ? 'grid-cols-2' :
                          table.columns.length === 3 ? 'grid-cols-3' :
                          table.columns.length === 4 ? 'grid-cols-4' :
                          'grid-cols-1'
                        }`}>
                          {table.columns.slice(0, 4).map((col, colIndex) => (
                            <div key={colIndex} className="truncate">
                              {row[col.name] !== null ? String(row[col.name]) : 'NULL'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {table.data.length > 10 && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                        ... {table.data.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <strong>Tip:</strong> Use table names like{' '}
                  {practiceExercise?.tables.slice(0, 2).map((table, index) => (
                    <span key={table.name}>
                      <code className="bg-blue-100 px-1 rounded">{table.name}</code>
                      {index < Math.min(practiceExercise.tables.length - 1, 1) && ' and '}
                    </span>
                  ))}
                  {' '}in your queries.
                  {practiceExercise?.tables && practiceExercise.tables.length > 2 && (
                    <span> ({practiceExercise.tables.length - 2} more tables available)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Far Right - Lesson Progression */}
      <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="text-sm text-gray-600 mb-2">5 lessons</div>
        </div>

        <div className="p-4 space-y-1">
          {LESSON_PROGRESSION.map((lesson) => (
            <div
              key={lesson.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                lesson.current
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {lesson.current ? (
                  <PlayCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : lesson.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <div className="text-sm font-medium">{lesson.title}</div>
              </div>
              {lesson.current && (
                <div className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                  Current
                </div>
              )}
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}