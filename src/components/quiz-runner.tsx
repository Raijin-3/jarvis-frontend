'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Award, Clock } from 'lucide-react';
import { apiPost } from '@/lib/api-client';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  quiz_options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  quiz_questions: QuizQuestion[];
}

interface QuizRunnerProps {
  quiz: Quiz;
  sectionTitle: string;
  courseId: string;
  subjectId: string;
  sectionId: string;
}

export function QuizRunner({ quiz, sectionTitle, courseId, subjectId, sectionId }: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = quiz.quiz_questions[currentQuestionIndex];
  const totalQuestions = quiz.quiz_questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000); // in seconds
      
      // Calculate score
      let correctCount = 0;
      const responses = quiz.quiz_questions.map((question, index) => {
        const selectedOptionId = selectedAnswers[index];
        const selectedOption = question.quiz_options.find(opt => opt.id === selectedOptionId);
        const isCorrect = selectedOption?.isCorrect || false;
        
        if (isCorrect) correctCount++;
        
        return {
          questionId: question.id,
          selectedOptionId: selectedOptionId || null,
          isCorrect,
        };
      });
      
      const score = (correctCount / totalQuestions) * 100;
      
      // Submit to backend
      await apiPost(`/v1/quizzes/${quiz.id}/submit`, {
        responses,
        score,
        timeTaken,
      });
      
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateResults = () => {
    let correctCount = 0;
    quiz.quiz_questions.forEach((question, index) => {
      const selectedOptionId = selectedAnswers[index];
      const selectedOption = question.quiz_options.find(opt => opt.id === selectedOptionId);
      if (selectedOption?.isCorrect) correctCount++;
    });
    return {
      correctCount,
      totalQuestions,
      score: Math.round((correctCount / totalQuestions) * 100),
    };
  };

  if (showResults) {
    const results = calculateResults();
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
            <Award className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
          <p className="text-gray-600 mb-8">{sectionTitle} ??? {quiz.title}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">{results.score}%</div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {results.correctCount}/{results.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Answers</h2>
            
            {quiz.quiz_questions.map((question, index) => {
              const selectedOptionId = selectedAnswers[index];
              const selectedOption = question.quiz_options.find(opt => opt.id === selectedOptionId);
              const correctOption = question.quiz_options.find(opt => opt.isCorrect);
              const isCorrect = selectedOption?.isCorrect || false;

              return (
                <div key={question.id} className="bg-white rounded-lg p-6 border border-gray-200 text-left">
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">
                        Question {index + 1}: {question.question}
                      </div>
                      
                      <div className="space-y-2">
                        {question.quiz_options.map((option) => {
                          const isSelected = option.id === selectedOptionId;
                          const isCorrectOption = option.isCorrect;
                          
                          let bgColor = 'bg-gray-50';
                          let borderColor = 'border-gray-200';
                          
                          if (isCorrectOption) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-500';
                          } else if (isSelected && !isCorrect) {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-500';
                          }
                          
                          return (
                            <div
                              key={option.id}
                              className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{option.text}</span>
                                {isSelected && <span className="text-xs font-medium">Your Answer</span>}
                                {isCorrectOption && <span className="text-xs font-medium text-green-600">Correct Answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <a
              href={`/curriculum/${courseId}/${subjectId}`}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              Back to Course
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-indigo-100">{sectionTitle}</p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-4">
            {currentQuestion.type}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.quiz_options.map((option) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(selectedAnswers).length !== totalQuestions}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Answer Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Questions Answered: {Object.keys(selectedAnswers).length}/{totalQuestions}</span>
            </div>
            
            {Object.keys(selectedAnswers).length !== totalQuestions && currentQuestionIndex === totalQuestions - 1 && (
              <span className="text-amber-600 font-medium">Please answer all questions before submitting</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
