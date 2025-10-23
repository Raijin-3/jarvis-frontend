"use client";

import { useState, useMemo } from 'react';
import { CodeExecutor } from './code-executor';
import { ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';
import { formatDatasetValue } from '@/lib/utils';

type ExerciseQuestion = {
  id: number;
  business_question: string;
  topics: string[];
  difficulty: string;
  adaptive_note: string;
  expected_output_table: string[];
};

type ExerciseWorkspaceProps = {
  exerciseType: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
  questions: ExerciseQuestion[];
  datasets: Array<{
    id: string;
    name: string;
    table_name?: string;
    columns?: string[];
    data?: any[];
    description?: string;
  }>;
  dataCreationSql?: string;
  headerText?: string;
  businessContext?: string;
  datasetDescription?: string;
  dataDictionary?: Record<string, string>;
};

export function ExerciseWorkspace({
  exerciseType,
  questions,
  datasets,
  dataCreationSql,
  headerText,
  businessContext,
  datasetDescription,
  dataDictionary,
}: ExerciseWorkspaceProps) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [isDatasetVisible, setIsDatasetVisible] = useState(true);

  // Debug logging
  console.log('🎯 ExerciseWorkspace Rendered:', {
    exerciseType,
    questionsCount: questions.length,
    datasetsCount: datasets.length,
    headerText,
    hasBusinessContext: !!businessContext,
    hasDatasetDescription: !!datasetDescription,
    dataDictionaryKeys: Object.keys(dataDictionary || {}).length,
    hasDataCreationSql: !!dataCreationSql,
  });

  // Filter out invalid questions (those with empty business_question or just ":")
  const validQuestions = useMemo(() => {
    const filtered = questions.filter(q => 
      q.business_question && 
      q.business_question.trim() !== '' && 
      q.business_question.trim() !== ':'
    );
    console.log('📝 Valid Questions:', {
      total: questions.length,
      valid: filtered.length,
      filtered: questions.length - filtered.length,
    });
    return filtered;
  }, [questions]);

  const activeQuestion = validQuestions[activeQuestionIndex];

  const handleExecutionComplete = (result: any) => {
    // Mark question as completed when code is executed successfully
    if (result && !result.error) {
      setCompletedQuestions(prev => new Set([...prev, activeQuestionIndex]));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
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

  if (validQuestions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
        <div className="text-center text-gray-500 mt-20">
          No valid questions available for this exercise.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
      
      {/* Sticky Dataset Section */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
        <div className="p-4">
          <button
            onClick={() => setIsDatasetVisible(!isDatasetVisible)}
            className="w-full flex items-center justify-between text-left hover:bg-white/50 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                📊
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {headerText || 'Dataset Information'}
                </h3>
                <p className="text-sm text-gray-600">
                  {datasets.length} table{datasets.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            {isDatasetVisible ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {isDatasetVisible && (
            <div className="mt-4 space-y-4">
              {/* Business Context */}
              {businessContext && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Business Context</h4>
                  <p className="text-sm text-gray-600">{businessContext}</p>
                </div>
              )}

              {/* Dataset Description */}
              {datasetDescription && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Dataset Description</h4>
                  <p className="text-sm text-gray-600">{datasetDescription}</p>
                </div>
              )}

              {/* Data Dictionary */}
              {dataDictionary && Object.keys(dataDictionary).length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Dictionary</h4>
                  <div className="space-y-2">
                    {Object.entries(dataDictionary).map(([key, value]) => (
                      <div key={key} className="flex gap-3 text-sm">
                        <span className="font-mono font-semibold text-blue-600 min-w-[150px]">
                          {key}
                        </span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dataset Tables Preview */}
              {datasets.map((dataset) => (
                <div key={dataset.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Table: {dataset.table_name || dataset.name}
                  </h4>
                  {dataset.data && dataset.data.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            {dataset.columns?.map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left font-semibold text-gray-700 border border-gray-200"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.data.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {dataset.columns?.map((col) => (
                                <td
                                  key={col}
                                  className="px-3 py-2 border border-gray-200 text-gray-600"
                                >
                                  {row[col] !== null && row[col] !== undefined
                                    ? formatDatasetValue(row[col])
                                    : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {dataset.data.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing 5 of {dataset.data.length} rows
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Tabs */}
      <div className="border-b border-gray-200 bg-white overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {validQuestions.map((question, index) => {
            const isActive = index === activeQuestionIndex;
            const isCompleted = completedQuestions.has(index);
            
            return (
              <button
                key={question.id}
                onClick={() => setActiveQuestionIndex(index)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                <span>Q{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Content */}
      <div className="p-6 space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                Question {activeQuestionIndex + 1} of {validQuestions.length}
              </h3>
              {activeQuestion.difficulty && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(activeQuestion.difficulty)}`}>
                  {activeQuestion.difficulty}
                </span>
              )}
            </div>
            
            {/* Topics */}
            {activeQuestion.topics && activeQuestion.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {activeQuestion.topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Question Text */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {activeQuestion.business_question}
              </p>
            </div>

            {/* Expected Output Hint */}
            {activeQuestion.expected_output_table && activeQuestion.expected_output_table.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Expected columns:</span>{' '}
                  {activeQuestion.expected_output_table.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Code Executor */}
        <div className="mt-6">
          <CodeExecutor
            exerciseType={exerciseType}
            datasets={datasets}
            dataCreationSql={dataCreationSql}
            initialCode=""
            onCodeChange={() => {}}
            onExecutionComplete={handleExecutionComplete}
          />
        </div>

        {/* Adaptive Note (if available) */}
        {activeQuestion.adaptive_note && activeQuestion.adaptive_note.trim() !== '' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">💡 Learning Tip</h4>
            <p className="text-sm text-amber-800">{activeQuestion.adaptive_note}</p>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Progress: {completedQuestions.size} of {validQuestions.length} questions attempted
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
              disabled={activeQuestionIndex === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveQuestionIndex(Math.min(validQuestions.length - 1, activeQuestionIndex + 1))}
              disabled={activeQuestionIndex === validQuestions.length - 1}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
