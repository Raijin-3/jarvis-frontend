"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Circle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CodeExecutor } from './code-executor';

type Question = {
  id: string;
  type: string;
  text: string;
  hint?: string;
  explanation?: string;
  points: number;
  order_index: number;
  content?: any;
  language?: string;
  isCompleted?: boolean;
  latestSubmission?: {
    userAnswer: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
    submittedAt: string;
    attemptNumber: number;
  };
  totalAttempts?: number;
};

type ExerciseQuestionTabsProps = {
  exerciseId: string;
  questions: Question[];
  dataCreationSql?: string;
  businessContext?: string;
  datasetDescription?: string;
  dataDictionary?: Record<string, string>;
  onSubmitAnswer: (questionId: string, answer: string, timeSpent?: number) => Promise<any>;
  onLoadDataset: (sql: string) => Promise<void>;
};

export function ExerciseQuestionTabs({
  exerciseId,
  questions,
  dataCreationSql,
  businessContext,
  datasetDescription,
  dataDictionary,
  onSubmitAnswer,
  onLoadDataset,
}: ExerciseQuestionTabsProps) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [hasDatasetLoadedOnce, setHasDatasetLoadedOnce] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Sort questions by order_index
  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);
  const activeQuestion = sortedQuestions[activeQuestionIndex];
  const executorType = (activeQuestion?.language || activeQuestion?.type || 'sql') as
    | 'sql'
    | 'python'
    | 'google_sheets'
    | 'statistics'
    | 'reasoning'
    | 'math'
    | 'geometry';

  const datasetInitializedRef = useRef(false);

  // Load dataset on mount (only once per exercise)
  useEffect(() => {
    if (!dataCreationSql || datasetInitializedRef.current) {
      return;
    }

    datasetInitializedRef.current = true;
    loadDataset();
  }, [dataCreationSql]);

  // Reset dataset state when exercise changes
  useEffect(() => {
    datasetInitializedRef.current = false;
    setDatasetLoaded(false);
    setLoadingDataset(false);
    setHasDatasetLoadedOnce(false);
  }, [exerciseId]);

  // Reset start time when question changes
  useEffect(() => {
    setStartTime(Date.now());
    setSubmissionResult(null);
  }, [activeQuestionIndex]);

  const loadDataset = async () => {
    if (!dataCreationSql) {
      console.warn('ExerciseQuestionTabs: No dataCreationSql provided; dataset load skipped.');
      return;
    }

    setLoadingDataset(true);
    try {
      await onLoadDataset(dataCreationSql);
      setDatasetLoaded(true);
      setHasDatasetLoadedOnce(true);
      console.log('✅ Dataset loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load dataset:', error);
    } finally {
      setLoadingDataset(false);
    }
  };

  useEffect(() => {
    if (datasetLoaded) {
      setHasDatasetLoadedOnce(true);
    }
  }, [datasetLoaded]);

  const handleAnswerChange = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!activeQuestion || submitting) return;

    const answer = userAnswers[activeQuestion.id];
    if (!answer || answer.trim() === '') {
      alert('Please enter an answer before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const result = await onSubmitAnswer(activeQuestion.id, answer, timeSpent);
      
      setSubmissionResult(result);
      
      // If correct, move to next question after a delay
      if (result.isCorrect) {
        setTimeout(() => {
          if (activeQuestionIndex < sortedQuestions.length - 1) {
            setActiveQuestionIndex(prev => prev + 1);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSubmissionResult({
        isCorrect: false,
        feedback: 'Failed to submit answer. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecutionComplete = (result: any) => {
    // Update user answer with executed code
    if (result && result.query) {
      handleAnswerChange(result.query);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty?.toLowerCase() || '';
    if (lower.includes('easy') || lower.includes('beginner')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (lower.includes('medium') || lower.includes('intermediate')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (lower.includes('hard') || lower.includes('advanced')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (sortedQuestions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg p-6">
        <p className="text-gray-500">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
      {/* Header with Business Context */}
      {businessContext && (
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Context</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{businessContext}</p>
        </div>
      )}

      {/* Dataset Information */}
      {datasetDescription && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Dataset</h3>
            {loadingDataset && (
              <span className="flex items-center text-sm text-blue-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading dataset...
              </span>
            )}
            {!loadingDataset && hasDatasetLoadedOnce && (
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Dataset loaded
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm mb-3">{datasetDescription}</p>
          
          {/* Data Dictionary */}
          {dataDictionary && Object.keys(dataDictionary).length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Data Dictionary:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(dataDictionary).map(([key, value]) => (
                  <div key={key} className="text-xs bg-white p-2 rounded border border-gray-200">
                    <span className="font-mono font-semibold text-blue-600">{key}:</span>{' '}
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto">
          {sortedQuestions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setActiveQuestionIndex(index)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                ${activeQuestionIndex === index
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent hover:bg-gray-50 text-gray-600'
                }
              `}
            >
              {question.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              <span className="font-medium">Question {index + 1}</span>
              {question.isCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        {activeQuestion && (
          <>
            {/* Question Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Question {activeQuestionIndex + 1}
                </h3>
                <div className="flex items-center gap-2">
                  {activeQuestion.content?.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(activeQuestion.content.difficulty)}`}>
                      {activeQuestion.content.difficulty}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {activeQuestion.points} {activeQuestion.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{activeQuestion.text}</p>
              
              {/* Topics */}
              {activeQuestion.content?.topics && activeQuestion.content.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeQuestion.content.topics.map((topic: string, idx: number) => (
                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Hint */}
              {activeQuestion.hint && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Hint:</strong> {activeQuestion.hint}
                  </p>
                </div>
              )}
            </div>

            {/* Code Editor for SQL questions */}
            {executorType === 'sql' && (
              <div className="mb-4">
                <CodeExecutor
                  exerciseType={executorType}
                  datasets={[]}
                  dataCreationSql={dataCreationSql}
                  onExecutionComplete={handleExecutionComplete}
                  initialCode={userAnswers[activeQuestion.id] || '-- Write your SQL query here\n'}
                  onCodeChange={handleAnswerChange}
                />
              </div>
            )}

            {/* Text area for other question types */}
            {activeQuestion.type !== 'sql' && (
              <div className="mb-4">
                <textarea
                  value={userAnswers[activeQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Enter your answer here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Submission Result */}
            {submissionResult && (
              <div className={`mb-4 p-4 rounded-lg border ${
                submissionResult.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {submissionResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      submissionResult.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {submissionResult.isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      submissionResult.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {submissionResult.feedback}
                    </p>
                    
                    {/* Show correct answer if incorrect */}
                    {!submissionResult.isCorrect && submissionResult.correctAnswer && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200">
                        <p className="text-sm font-semibold text-gray-800 mb-1">Correct Answer:</p>
                        <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                          {submissionResult.correctAnswer}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Previous Submission Info */}
            {activeQuestion.latestSubmission && !submissionResult && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Previous Attempt:</strong> {activeQuestion.latestSubmission.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  {' '}(Attempt #{activeQuestion.latestSubmission.attemptNumber})
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {activeQuestion.totalAttempts ? (
                  <span>Attempts: {activeQuestion.totalAttempts}</span>
                ) : (
                  <span>No attempts yet</span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !userAnswers[activeQuestion.id]}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${submitting || !userAnswers[activeQuestion.id]
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Answer'
                )}
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {sortedQuestions.filter(q => q.isCompleted).length} / {sortedQuestions.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(sortedQuestions.filter(q => q.isCompleted).length / sortedQuestions.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
