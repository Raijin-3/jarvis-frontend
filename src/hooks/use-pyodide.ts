"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type ExecutionResult = {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
};

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export function usePyodide() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initPyodide = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load Pyodide from CDN
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!mounted) return;

        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        if (!mounted) return;

        // Load commonly used packages
        await pyodide.loadPackage(['numpy', 'pandas']);

        if (!mounted) return;

        pyodideRef.current = pyodide;
        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Pyodide:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Pyodide');
          setIsLoading(false);
        }
      }
    };

    initPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const executeCode = useCallback(async (code: string): Promise<ExecutionResult> => {
    if (!pyodideRef.current || !isReady) {
      return {
        success: false,
        error: 'Python runtime not ready',
      };
    }

    const startTime = performance.now();

    try {
      // Capture stdout
      const captureCode = `
import sys
from io import StringIO

_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(str(e), file=sys.stderr)
    raise

_output = _stdout.getvalue()
_error = _stderr.getvalue()
`;

      await pyodideRef.current.runPythonAsync(captureCode);
      
      const output = pyodideRef.current.globals.get('_output');
      const errorOutput = pyodideRef.current.globals.get('_error');
      const endTime = performance.now();

      if (errorOutput) {
        return {
          success: false,
          error: errorOutput,
          executionTime: endTime - startTime,
        };
      }

      return {
        success: true,
        output: output || 'Code executed successfully (no output)',
        executionTime: endTime - startTime,
      };
    } catch (err) {
      const endTime = performance.now();
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Code execution failed',
        executionTime: endTime - startTime,
      };
    }
  }, [isReady]);

  const loadPackage = useCallback(async (packageName: string): Promise<boolean> => {
    if (!pyodideRef.current || !isReady) {
      console.error('Python runtime not ready');
      return false;
    }

    try {
      await pyodideRef.current.loadPackage(packageName);
      return true;
    } catch (err) {
      console.error(`Failed to load package ${packageName}:`, err);
      return false;
    }
  }, [isReady]);

  const reset = useCallback(async (): Promise<void> => {
    if (!pyodideRef.current || !isReady) {
      return;
    }

    try {
      // Reset the Python environment
      await pyodideRef.current.runPythonAsync(`
import sys
for module in list(sys.modules.keys()):
    if not module.startswith('_') and module not in ['sys', 'builtins']:
        del sys.modules[module]
`);
    } catch (err) {
      console.error('Failed to reset Python environment:', err);
    }
  }, [isReady]);

  const loadDataFrame = useCallback(async (
    varName: string,
    data: any[]
  ): Promise<boolean> => {
    if (!pyodideRef.current || !isReady) {
      console.error('Python runtime not ready');
      return false;
    }

    try {
      // Ensure pandas is loaded
      await pyodideRef.current.loadPackage('pandas');

      // Convert data to JSON string
      const dataJson = JSON.stringify(data);

      // Create DataFrame in Pyodide
      await pyodideRef.current.runPythonAsync(`
import pandas as pd
import json

# Load dataset
${varName}_data = json.loads('''${dataJson}''')
${varName} = pd.DataFrame(${varName}_data)
`);

      return true;
    } catch (err) {
      console.error(`Failed to load DataFrame ${varName}:`, err);
      return false;
    }
  }, [isReady]);

  return {
    isReady,
    isLoading,
    error,
    executeCode,
    loadPackage,
    loadDataFrame,
    reset,
  };
}