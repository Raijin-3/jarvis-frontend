"use client";

import { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, Database, Code, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useDuckDB } from '@/hooks/use-duckdb';
import { usePyodide } from '@/hooks/use-pyodide';

type Dataset = {
  id: string;
  name: string;
  description?: string;
  table_name?: string;
  columns?: string[];
  data?: any[];
  creation_sql?: string;
  schema_info?: any;
};

type CodeExecutorProps = {
  exerciseType: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
  datasets?: Dataset[];
  dataCreationSql?: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: any) => void;
};

export function CodeExecutor({
  exerciseType,
  datasets = [],
  dataCreationSql,
  initialCode = '',
  onCodeChange,
  onExecutionComplete,
}: CodeExecutorProps) {
  const [code, setCode] = useState(initialCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [datasetsLoaded, setDatasetsLoaded] = useState(false);

  // Initialize execution engines
  const duckdb = useDuckDB();
  const pyodide = usePyodide();

  // Determine which engine to use
  const useSQL = exerciseType === 'sql';
  const usePython = exerciseType === 'python' || exerciseType === 'statistics';
  
  const engine = useSQL ? duckdb : usePython ? pyodide : null;
  const isEngineReady = engine?.isReady || false;
  const isEngineLoading = engine?.isLoading || false;
  const engineError = engine?.error || null;

  // Reset dataset load flag whenever the inputs change
  useEffect(() => {
    setDatasetsLoaded(false);
  }, [exerciseType, datasets, dataCreationSql]);

  // Load datasets when engine is ready
  useEffect(() => {
    if (!isEngineReady || datasetsLoaded) return;
    if (!dataCreationSql && datasets.length === 0) return;

    const loadDatasets = async () => {
      if (useSQL && duckdb.isReady) {
        // Load SQL datasets
        const executedStatements = new Set<string>();

        const splitSqlStatements = (sql: string) => {
          const statements: string[] = [];
          let current = '';
          let inSingleQuote = false;
          let inDoubleQuote = false;
          let inBacktick = false;

          for (let i = 0; i < sql.length; i++) {
            const char = sql[i];
            const prevChar = sql[i - 1];

            if (char === '\'' && prevChar !== '\\' && !inDoubleQuote && !inBacktick) {
              inSingleQuote = !inSingleQuote;
            } else if (char === '"' && prevChar !== '\\' && !inSingleQuote && !inBacktick) {
              inDoubleQuote = !inDoubleQuote;
            } else if (char === '`' && prevChar !== '\\' && !inSingleQuote && !inDoubleQuote) {
              inBacktick = !inBacktick;
            }

            if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
              if (current.trim().length > 0) {
                statements.push(current.trim());
              }
              current = '';
            } else {
              current += char;
            }
          }

          if (current.trim().length > 0) {
            statements.push(current.trim());
          }

          return statements;
        };

        const executeSqlBlock = async (sql?: string) => {
          if (!sql) return;

          const sanitized = sql
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');

          for (const statement of splitSqlStatements(sanitized)) {
            const normalized = statement.replace(/\s+/g, ' ').trim();

            if (!normalized || executedStatements.has(normalized.toLowerCase())) {
              continue;
            }

            const result = await duckdb.executeQuery(statement);
            if (!result.success) {
              console.error('Failed to execute SQL statement:', {
                statement,
                error: result.error,
              });
              throw new Error(result.error || 'SQL execution failed');
            }

            executedStatements.add(normalized.toLowerCase());
          }
        };

        try {
          console.log('🔧 CodeExecutor: Loading datasets into DuckDB...', {
            hasDataCreationSql: !!dataCreationSql,
            dataCreationSqlLength: dataCreationSql?.length || 0,
            datasetsCount: datasets.length
          });

          if (dataCreationSql && dataCreationSql.trim().length > 0) {
            console.log('📊 CodeExecutor: Executing data creation SQL...');
            await executeSqlBlock(dataCreationSql);
            console.log('✅ CodeExecutor: Data creation SQL executed in DuckDB.');
          }

          for (const dataset of datasets) {
            if (dataset.creation_sql) {
              console.log(`📊 CodeExecutor: Executing creation SQL for dataset: ${dataset.name}`);
              await executeSqlBlock(dataset.creation_sql);
            } else if (dataset.data && dataset.table_name) {
              console.log(`📊 CodeExecutor: Loading dataset: ${dataset.table_name}`);
              await duckdb.loadDataset(dataset.table_name, dataset.data, dataset.columns);
            }
          }

          // Verify tables were created
          const result = await duckdb.executeQuery('SHOW TABLES');
          if (result.success) {
            console.log('📋 CodeExecutor: Tables in DuckDB:', result.result?.rows);
          }

          setDatasetsLoaded(true);
          console.log('✅ CodeExecutor: All datasets loaded successfully');
        } catch (error) {
          console.error('❌ CodeExecutor: Failed to load datasets into DuckDB:', error);
          setExecutionResult({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load datasets'
          });
        }
      } else if (usePython && pyodide.isReady) {
        // For Python, we can load data as pandas DataFrames
        if (datasets.length > 0 && datasets[0].data) {
          const dataset = datasets[0];
          const dataJson = JSON.stringify(dataset.data);
          await pyodide.executeCode(`
import pandas as pd
import json

data = json.loads('${dataJson.replace(/'/g, "\\'")}')
df = pd.DataFrame(data)
print("Dataset loaded with shape:", df.shape)
`);
        }
        setDatasetsLoaded(true);
      }
    };

    loadDatasets();
  }, [isEngineReady, datasetsLoaded, datasets, useSQL, usePython, duckdb, pyodide, dataCreationSql]);

  // Update code when initialCode changes
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  const executeCode = useCallback(async () => {
    if (!isEngineReady || isExecuting) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      let result;

      if (useSQL && duckdb.isReady) {
        result = await duckdb.executeQuery(code);
      } else if (usePython && pyodide.isReady) {
        result = await pyodide.executeCode(code);
      } else {
        result = {
          success: false,
          error: 'Execution engine not available for this exercise type',
        };
      }

      setExecutionResult(result);
      onExecutionComplete?.(result);
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
      setExecutionResult(errorResult);
      onExecutionComplete?.(errorResult);
    } finally {
      setIsExecuting(false);
    }
  }, [isEngineReady, isExecuting, code, useSQL, usePython, duckdb, pyodide, onExecutionComplete]);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    setExecutionResult(null);
    onCodeChange?.(initialCode);
  }, [initialCode, onCodeChange]);

  const getPlaceholder = () => {
    switch (exerciseType) {
      case 'sql':
        return '-- Write your SQL query here\nSELECT * FROM table_name;';
      case 'python':
        return '# Write your Python code here\nprint("Hello, World!")';
      case 'statistics':
        return '# Statistical analysis\nimport pandas as pd\nimport numpy as np\n\n# Your analysis here';
      default:
        return '# Write your code here';
    }
  };

  const getEditorTheme = () => {
    if (exerciseType === 'sql') {
      return {
        bg: 'bg-[#0f172a]',
        text: 'text-green-400',
        border: 'border-gray-700',
      };
    }
    return {
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      border: 'border-gray-700',
    };
  };

  const theme = getEditorTheme();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white">
          {useSQL ? <Database className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {exerciseType === 'sql' ? 'SQL' : exerciseType === 'python' ? 'Python' : 'Code'} Editor
          </span>
          {isEngineLoading && (
            <span className="text-xs text-gray-400">(Loading engine...)</span>
          )}
          {datasetsLoaded && datasets.length > 0 && (
            <span className="text-xs text-green-400">✓ Datasets loaded</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={isExecuting}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={executeCode}
            disabled={!isEngineReady || isExecuting}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
          >
            {isExecuting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isExecuting ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Engine Error */}
      {engineError && (
        <div className="px-4 py-2 bg-red-900/20 border-b border-red-800 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {engineError}
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className={`flex-1 font-mono text-sm p-4 outline-none resize-none ${theme.bg} ${theme.text}`}
          placeholder={getPlaceholder()}
          spellCheck={false}
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            tabSize: 2,
          }}
        />
      </div>

      {/* Results Panel */}
      {executionResult && (
        <div className={`border-t ${theme.border} max-h-64 overflow-auto`}>
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {executionResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {executionResult.success ? 'Success' : 'Error'}
              </span>
            </div>
            {executionResult.executionTime && (
              <span className="text-xs text-gray-400">
                {executionResult.executionTime.toFixed(2)}ms
              </span>
            )}
          </div>

          <div className="p-4 bg-gray-900">
            {executionResult.success ? (
              <>
                {/* SQL Results */}
                {executionResult.result && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-700">
                      <thead>
                        <tr className="bg-gray-800">
                          {executionResult.result.columns.map((col: string, idx: number) => (
                            <th key={idx} className="px-3 py-2 border border-gray-700 text-left text-gray-300">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.result.rows.map((row: any[], rowIdx: number) => (
                          <tr key={rowIdx} className="hover:bg-gray-800">
                            {row.map((cell: any, cellIdx: number) => (
                              <td key={cellIdx} className="px-3 py-2 border border-gray-700 text-gray-400">
                                {cell === null ? <span className="text-gray-600">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 text-xs text-gray-500">
                      {executionResult.result.rowCount} row(s) returned
                    </div>
                  </div>
                )}

                {/* Python Output */}
                {executionResult.output && (
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {executionResult.output}
                  </pre>
                )}
              </>
            ) : (
              <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono">
                {executionResult.error}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
