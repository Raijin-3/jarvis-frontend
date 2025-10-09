"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { getCachedDuckDb, initializeDuckDb } from '@/lib/duckdb-initializer';

type QueryResult = {
  columns: string[];
  rows: any[][];
  rowCount: number;
};

type ExecutionResult = {
  success: boolean;
  result?: QueryResult;
  error?: string;
  executionTime?: number;
};

export function useDuckDB() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<duckdb.AsyncDuckDB | null>(null);
  const connRef = useRef<duckdb.AsyncDuckDBConnection | null>(null);

  useEffect(() => {
    let mounted = true;

    const attachResources = (resources: { db: duckdb.AsyncDuckDB; conn: duckdb.AsyncDuckDBConnection }) => {
      dbRef.current = resources.db;
      connRef.current = resources.conn;
      setIsReady(true);
      setIsLoading(false);
    };

    const initDB = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const resources = await initializeDuckDb();
        if (!mounted) {
          return;
        }

        attachResources(resources);
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize DuckDB');
          setIsLoading(false);
        }
      }
    };

    const cached = getCachedDuckDb();

    if (cached) {
      attachResources(cached);
    } else {
      initDB();
    }

    return () => {
      mounted = false;
    };
  }, []);

  const executeQuery = useCallback(async (query: string): Promise<ExecutionResult> => {
    if (!connRef.current || !isReady) {
      return {
        success: false,
        error: 'Database not ready',
      };
    }

    const startTime = performance.now();

    try {
      const result = await connRef.current.query(query);
      const endTime = performance.now();

      const columns = result.schema.fields.map(field => field.name);
      const rows: any[][] = [];

      for (let i = 0; i < result.numRows; i++) {
        const row: any[] = [];
        for (let j = 0; j < result.numCols; j++) {
          const column = result.getChildAt(j);
          row.push(column?.get(i));
        }
        rows.push(row);
      }

      return {
        success: true,
        result: {
          columns,
          rows,
          rowCount: result.numRows,
        },
        executionTime: endTime - startTime,
      };
    } catch (err) {
      const endTime = performance.now();
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Query execution failed',
        executionTime: endTime - startTime,
      };
    }
  }, [isReady]);

  const loadDataset = useCallback(async (tableName: string, data: any[], columns?: string[]): Promise<boolean> => {
    if (!connRef.current || !isReady) {
      console.error('Database not ready');
      return false;
    }

    try {
      // Drop table if exists
      const escapedTableName = tableName.replace(/"/g, '""');
      await connRef.current.query(`DROP TABLE IF EXISTS "${escapedTableName}"`);

      // Convert data to Arrow table format
      if (data.length === 0) {
        console.warn('No data to load');
        return false;
      }

      // Create table from JSON data
      const jsonData = JSON.stringify(data);
      const safeJson = jsonData.replace(/'/g, "''");
      await connRef.current.query(
        `CREATE TABLE "${escapedTableName}" AS SELECT * FROM read_json_auto('${safeJson}')`,
      );

      return true;
    } catch (err) {
      console.error('Failed to load dataset:', err);
      return false;
    }
  }, [isReady]);

  const loadDatasetFromSQL = useCallback(async (createSQL: string): Promise<boolean> => {
    if (!connRef.current || !isReady) {
      console.error('Database not ready');
      return false;
    }

    try {
      await connRef.current.query(createSQL);
      return true;
    } catch (err) {
      console.error('Failed to load dataset from SQL:', err);
      return false;
    }
  }, [isReady]);

  const reset = useCallback(async (): Promise<void> => {
    if (!connRef.current || !isReady) {
      return;
    }

    try {
      const result = await connRef.current.query('SHOW TABLES');
      const tables: string[] = [];

      for (let i = 0; i < result.numRows; i++) {
        const nameColumn = result.getChildAt(0);
        const name = nameColumn?.get(i);
        if (name) {
          tables.push(String(name));
        }
      }

      for (const table of tables) {
        const escaped = table.replace(/"/g, '""');
        await connRef.current.query(`DROP TABLE IF EXISTS "${escaped}"`);
      }
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  }, [isReady]);

  return {
    isReady,
    isLoading,
    error,
    executeQuery,
    loadDataset,
    loadDatasetFromSQL,
    reset,
  };
}
