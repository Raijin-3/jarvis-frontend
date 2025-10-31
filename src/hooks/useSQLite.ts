import { useState, useEffect, useCallback, useRef } from 'react';

export interface SQLResult {
  columns: string[];
  values: any[][];
}

export interface SQLiteError {
  message: string;
  errno?: number;
}

export interface UseSQLiteReturn {
  db: any | null;
  isLoading: boolean;
  error: SQLiteError | null;
  execute: (sql: string) => Promise<SQLResult[]>;
  createTable: (tableName: string, columns: string[]) => Promise<void>;
  insertData: (tableName: string, data: any[]) => Promise<void>;
  runQuery: (sql: string) => Promise<SQLResult[]>;
  exportDatabase: () => Uint8Array | null;
  importDatabase: (buffer: Uint8Array) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

export function useSQLite(initialData?: ArrayBuffer | Uint8Array): UseSQLiteReturn {
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<SQLiteError | null>(null);
  const SQL = useRef<any>(null);

  // Initialize SQL.js WASM
  useEffect(() => {
    const initializeSQL = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          setError({ message: 'SQLite only works in browser environment' });
          setIsLoading(false);
          return;
        }

        // Set a timeout for initialization (30 seconds)
        const timeoutId = setTimeout(() => {
          setError({
            message: 'SQLite initialization timed out. The CDN might be unavailable or your connection is slow.'
          });
          setIsLoading(false);
        }, 30000);

        // Load SQL.js from CDN to avoid bundling issues
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load SQL.js from CDN'));
          document.head.appendChild(script);
        });

        // Initialize SQL.js
        const sqlModule = await (window as any).initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        SQL.current = sqlModule;

        // Create database instance
        let database: any;

        if (initialData) {
          // Load existing database
          database = new sqlModule.Database(initialData);
        } else {
          // Create new empty database
          database = new sqlModule.Database();
        }

        clearTimeout(timeoutId);
        setDb(database);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize SQLite:', err);
        setError({
          message: err.message || 'Failed to initialize SQLite database. Please check your internet connection and try again.',
          errno: err.errno
        });
        setIsLoading(false);
      }
    };

    initializeSQL();

    // Cleanup
    return () => {
      if (db) {
        try {
          db.close();
        } catch (err) {
          console.warn('Error closing database:', err);
        }
      }
    };
  }, []); // Empty dependency array - only run once

  // Execute SQL query
  const execute = useCallback(async (sql: string): Promise<SQLResult[]> => {
    if (!db || !SQL.current) {
      throw new Error('Database not initialized');
    }

    try {
      const results: SQLResult[] = [];
      const statements = sql.trim().split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (!trimmedStatement) continue;

        try {
          // Check if statement is a SELECT or has potential results
          const isSelect = /^\s*SELECT/i.test(trimmedStatement);
          const isExplain = /^\s*EXPLAIN/i.test(trimmedStatement);
          const isPragma = /^\s*PRAGMA/i.test(trimmedStatement);

          if (isSelect || isExplain || isPragma) {
            // Statements that return results
            const result = db.exec(trimmedStatement);
            if (result.length > 0) {
              result.forEach((res: any) => {
                results.push({
                  columns: res.columns,
                  values: res.values
                });
              });
            } else {
              // Empty result set (still counts as a successful select)
              results.push({
                columns: [],
                values: []
              });
            }
          } else {
            // DDL/DML statements that don't return results
            // Handle common MySQL commands that don't exist in SQLite
            const upperStatement = trimmedStatement.toUpperCase().trim();

            if (upperStatement.startsWith('SHOW ')) {
              // Convert common SHOW commands to SQLite equivalents
              if (upperStatement === 'SHOW TABLES') {
                const result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
                if (result.length > 0) {
                  result.forEach((res: any) => {
                    results.push({
                      columns: res.columns,
                      values: res.values
                    });
                  });
                } else {
                  results.push({
                    columns: [],
                    values: []
                  });
                }
              } else if (upperStatement === 'SHOW DATABASES') {
                // SQLite doesn't have multiple databases like MySQL
                results.push({
                  columns: ['Database'],
                  values: [['main']]  // SQLite's main database
                });
              } else {
                throw new Error(`SQLite doesn't support "${trimmedStatement}". Try "SELECT name FROM sqlite_master WHERE type='table';" for tables.`);
              }
            } else if (upperStatement.startsWith('USE ')) {
              // SQLite doesn't have USE command - it's a single database
              results.push({
                columns: ['Message'],
                values: [['SQLite uses a single database file - no USE command needed']]
              });
            } else {
              db.run(trimmedStatement);
            }
          }
        } catch (stmtError: any) {
          // Statement-level error
          console.error(`Error in statement "${trimmedStatement}":`, stmtError);
          throw new Error(`SQL Error: ${stmtError.message}`);
        }
      }

      return results;
    } catch (err: any) {
      console.error('SQL execution error:', err);
      throw new Error(`Database error: ${err.message}`);
    }
  }, [db]);

  // Create table utility
  const createTable = useCallback(async (tableName: string, columns: string[]): Promise<void> => {
    const columnDefinitions = columns.map(col => {
      // Basic column definition - could be enhanced with types, constraints, etc.
      return `"${col}" TEXT`;
    }).join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefinitions})`;
    await execute(sql);
  }, [execute]);

  // Insert data utility
  const insertData = useCallback(async (tableName: string, data: any[]): Promise<void> => {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map(col => `"${col}"`).join(', ');

    const sql = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`;

    for (const row of data) {
      const values = columns.map(col => row[col]);
      db.run(sql, values);
    }
  }, [db]);

  // Run read-only query (convenience method)
  const runQuery = useCallback(async (sql: string): Promise<SQLResult[]> => {
    return execute(sql);
  }, [execute]);

  // Export database as Uint8Array
  const exportDatabase = useCallback((): Uint8Array | null => {
    if (!db) return null;
    return db.export();
  }, [db]);

  // Import database from Uint8Array
  const importDatabase = useCallback(async (buffer: Uint8Array): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Close existing database
      if (db) {
        db.close();
      }

      // Create new database from buffer
      const newDb = new SQL.current.Database(buffer);
      setDb(newDb);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to import database:', err);
      setError({
        message: err.message || 'Failed to import database',
        errno: err.errno
      });
      setIsLoading(false);
      throw err;
    }
  }, [db]);

  // Reset database (create new empty database)
  const resetDatabase = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Close existing database
      if (db) {
        db.close();
      }

      // Create new empty database
      const newDb = new SQL.current.Database();
      setDb(newDb);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to reset database:', err);
      setError({
        message: err.message || 'Failed to reset database',
        errno: err.errno
      });
      setIsLoading(false);
      throw err;
    }
  }, [db]);

  return {
    db,
    isLoading,
    error,
    execute,
    createTable,
    insertData,
    runQuery,
    exportDatabase,
    importDatabase,
    resetDatabase
  };
}
