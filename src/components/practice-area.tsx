"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Play, 
  Code, 
  Database, 
  BarChart3, 
  FileSpreadsheet,
  Check,
  X,
  Clock,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { RichContent } from './rich-content';
import { formatDatasetValue } from '@/lib/utils';

type PracticeQuestion = {
  id: string;
  exercise_id: string;
  text: string;
  type: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
  language?: string;
  content?: any;
  hint?: string;
  explanation?: string;
  starter_code?: string;
  expected_runtime?: number;
  test_cases?: any[];
  sample_data?: any;
  order_index: number;
};

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

type PracticeAreaProps = {
  questions: PracticeQuestion[];
  datasets: Dataset[];
  exerciseType: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
  exerciseTitle?: string;
  onSubmit?: (questionId: string, solution: string) => Promise<{ success: boolean; isCorrect?: boolean; feedback?: string }>;
  onNext?: () => void;
  onPrevious?: () => void;
};

const getLanguageIcon = (type: string) => {
  switch (type) {
    case 'sql':
      return <Database className="w-4 h-4" />;
    case 'python':
      return <Code className="w-4 h-4" />;
    case 'statistics':
      return <BarChart3 className="w-4 h-4" />;
    case 'google_sheets':
      return <FileSpreadsheet className="w-4 h-4" />;
    default:
      return <Code className="w-4 h-4" />;
  }
};

const getLanguageDisplayName = (type: string) => {
  switch (type) {
    case 'sql':
      return 'SQL';
    case 'python':
      return 'Python';
    case 'statistics':
      return 'Statistics';
    case 'google_sheets':
      return 'Google Sheets';
    case 'reasoning':
      return 'Logic & Reasoning';
    case 'math':
      return 'Mathematics';
    case 'geometry':
      return 'Geometry';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const getDefaultCode = (type: string, questionText: string) => {
  switch (type) {
    case 'sql':
      return '-- Write your SQL query here\nSELECT \n  \nFROM \n  \nWHERE \n  ;';
    case 'python':
      return `# Write your Python solution here
def solution():
    # Your code here
    pass

# Test your solution
result = solution()
print(result)`;
    case 'statistics':
      return `# Statistical analysis
import pandas as pd
import numpy as np

# Your analysis here
`;
    case 'google_sheets':
      return '=';
    default:
      return '# Write your solution here';
  }
};

export function PracticeArea({
  questions,
  datasets,
  exerciseType,
  exerciseTitle,
  onSubmit,
  onNext,
  onPrevious
}: PracticeAreaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [showDataset, setShowDataset] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    isCorrect?: boolean;
    feedback?: string;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const currentQuestion = questions[currentQuestionIndex];
  const currentDataset = datasets[currentQuestionIndex];

  const resolvedQuestionText = useMemo(() => {
    if (!currentQuestion) {
      return '';
    }

    const rawContent =
      typeof (currentQuestion as any)?.content === 'string'
        ? (currentQuestion as any).content
        : typeof (currentQuestion as any)?.content?.text === 'string'
        ? (currentQuestion as any).content.text
        : undefined;

    const candidates = [
      currentQuestion.text,
      (currentQuestion as any)?.question_text,
      (currentQuestion as any)?.business_question,
      (currentQuestion as any)?.prompt,
      rawContent,
    ];

    const match = candidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

    return match ?? '';
  }, [currentQuestion]);

  // Initialize code when question changes
  useEffect(() => {
    if (currentQuestion) {
      const defaultCode =
        currentQuestion.starter_code || getDefaultCode(exerciseType, resolvedQuestionText);
      setUserCode(defaultCode);
      setSubmissionResult(null);
      setShowHint(false);
      setElapsedTime(0);
      setIsTimerRunning(true);
    }
  }, [currentQuestionIndex, currentQuestion, exerciseType, resolvedQuestionText]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit || !currentQuestion) return;

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const result = await onSubmit(currentQuestion.id, userCode);
      setSubmissionResult(result);
    } catch (error) {
      setSubmissionResult({
        success: false,
        feedback: 'An error occurred while submitting your solution.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, currentQuestion, userCode]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (onNext) {
      onNext();
    }
  }, [currentQuestionIndex, questions.length, onNext]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (onPrevious) {
      onPrevious();
    }
  }, [currentQuestionIndex, onPrevious]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No questions available
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)]">
      {/* Left Panel - Question Description */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getLanguageIcon(exerciseType)}
              <h2 className="text-lg font-semibold text-gray-900">
                {exerciseTitle || 'Practice Exercise'}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(elapsedTime)}
              </div>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {getLanguageDisplayName(exerciseType)}
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Question Number and Navigation */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 rounded"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="prose-content">
              <RichContent content={resolvedQuestionText} className="text-gray-700" />
            </div>

            {/* Dataset Section */}
            {currentDataset && (
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowDataset(!showDataset)}
                  className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">Dataset: {currentDataset.name}</span>
                  </div>
                  {showDataset ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {showDataset && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-gray-600 mb-2">{currentDataset.description}</p>
                    {currentDataset.columns && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Columns:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentDataset.columns.map((column, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded">
                              {column}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentDataset.data && currentDataset.data.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              {Object.keys(currentDataset.data[0] || {}).map((key) => (
                                <th key={key} className="px-2 py-1 border border-gray-200 text-left">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentDataset.data.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((value: any, valueIdx) => (
                                  <td key={valueIdx} className="px-2 py-1 border border-gray-200">
                                    {formatCellValue(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hint Section */}
            {currentQuestion.hint && (
              <div className="border border-yellow-200 rounded-lg">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="w-full p-3 text-left flex items-center justify-between hover:bg-yellow-50"
                >
                  <span className="font-medium text-yellow-800">💡 Hint</span>
                  {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {showHint && (
                  <div className="px-3 pb-3 text-sm text-yellow-700">
                    <RichContent content={currentQuestion.hint} className="text-yellow-700" />
                  </div>
                )}
              </div>
            )}

            {/* Explanation Section */}
            {currentQuestion.explanation && submissionResult && (
              <div className="border border-blue-200 rounded-lg">
                <div className="p-3 bg-blue-50">
                  <span className="font-medium text-blue-800">📝 Explanation</span>
                </div>
                <div className="px-3 py-3 text-sm text-blue-900">
                  <RichContent content={currentQuestion.explanation} className="text-blue-900" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="w-1/2 flex flex-col">
        {/* Code Editor Header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Solution ({getLanguageDisplayName(exerciseType)})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const defaultCode = getDefaultCode(exerciseType, resolvedQuestionText);
                setUserCode(defaultCode);
                setSubmissionResult(null);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isSubmitting ? 'Running...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1">
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm border-none resize-none focus:outline-none"
            placeholder={`Write your ${getLanguageDisplayName(exerciseType)} solution here...`}
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              tabSize: 2,
              minHeight: '400px'
            }}
          />
        </div>
        {/* Output Section */}
        <div className="border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Output
            </span>
          </div>
          <div className="px-4 py-3 text-sm text-gray-700 min-h-[120px] overflow-auto">
            {submissionResult ? (
              <div
                className={`flex flex-col gap-2 rounded-lg border p-3 ${
                  submissionResult.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {submissionResult.isCorrect ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      submissionResult.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {submissionResult.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {submissionResult.feedback ? (
                  <div
                    className={`text-sm ${
                      submissionResult.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    <RichContent content={submissionResult.feedback} />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Run your solution to see detailed feedback here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
