"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Circle, RotateCcw } from "lucide-react";
import { FormattedText } from "@/components/ui/rich-text-editor";

type QuizQuestionOption = {
  id?: string;
  text?: string;
  correct?: boolean;
};

type QuizQuestion = {
  id?: string;
  text?: string;
  content?: string;
  type?: string;
  quiz_options?: QuizQuestionOption[];
};

export type SectionQuiz = {
  id?: string;
  title?: string;
  quiz_questions?: QuizQuestion[];
  type?: string;
};

export type QuizRunnerResult = {
  score: number;
  total: number;
  answers: Record<string, string[]>;
};

type QuizReviewItem = {
  key: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

interface SectionQuizRunnerProps {
  quiz: SectionQuiz;
  sectionTitle?: string;
  onComplete?: (result: QuizRunnerResult) => void;
  onRestart?: () => void;
  headerAccessory?: ReactNode;
  fallbackTitle?: string;
}

const normalize = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase();

const extractQuestionText = (question: QuizQuestion): string => {
  const candidates = [
    (question as any)?.prompt,
    question.text,
    question.content,
    (question as any)?.question,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length) {
      return candidate;
    }
  }

  return "";
};

export function SectionQuizRunner({
  quiz,
  sectionTitle,
  onComplete,
  onRestart,
  headerAccessory,
  fallbackTitle = "Quiz",
}: SectionQuizRunnerProps) {
  const questions = useMemo(
    () => quiz?.quiz_questions?.filter(Boolean) ?? [],
    [quiz?.quiz_questions],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState<QuizReviewItem[]>([]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setCompleted(false);
    setScore(0);
    setReview([]);
  }, [quiz?.id]);

  const totalQuestions = questions.length;
  const currentQuestion = totalQuestions > 0 ? questions[currentIndex] : undefined;

  const currentKey = useMemo(
    () => (currentQuestion?.id ? String(currentQuestion.id) : String(currentIndex)),
    [currentQuestion?.id, currentIndex],
  );

  const selectedAnswer = answers[currentKey] ?? [];

  const progressPct = useMemo(() => {
    if (!totalQuestions) return 0;
    return ((currentIndex + 1) / totalQuestions) * 100;
  }, [currentIndex, totalQuestions]);

  const updateAnswer = useCallback(
    (value: string[]) => {
      setAnswers((prev) => ({
        ...prev,
        [currentKey]: value,
      }));
    },
    [currentKey],
  );

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      finish();
    }
  }, [currentIndex, totalQuestions]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  }, [currentIndex]);

  const finish = useCallback(() => {
    if (!totalQuestions) return;

    const snapshot = { ...answers };
    const nextReview: QuizReviewItem[] = [];
    let correctCount = 0;

    questions.forEach((question, index) => {
      const key = question.id ?? index.toString();
      const normalizedKey = String(key);
      const userResponses = snapshot[normalizedKey] ?? [];
      const userAnswer = userResponses[0] ?? "";
      const normalizedUserAnswer = normalize(userAnswer);

      const text = extractQuestionText(question);
      const correctOptions =
        (question.quiz_options || []).filter((option) =>
          option ? option.correct : false,
        ) ?? [];

      const firstCorrect = correctOptions.find((option) =>
        normalize(option?.text) === normalizedUserAnswer,
      );

      const isCorrect =
        Boolean(correctOptions.length) && Boolean(firstCorrect);

      if (isCorrect) {
        correctCount += 1;
      }

      nextReview.push({
        key: normalizedKey,
        questionText: text,
        userAnswer,
        correctAnswer: correctOptions[0]?.text ?? "",
        isCorrect,
      });
    });

    setScore(correctCount);
    setReview(nextReview);
    setCompleted(true);

    onComplete?.({
      score: correctCount,
      total: totalQuestions,
      answers: snapshot,
    });
  }, [answers, questions, totalQuestions, onComplete]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setCompleted(false);
    setScore(0);
    setReview([]);
    onRestart?.();
  }, [onRestart]);

  if (!totalQuestions) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center text-gray-500 shadow-lg backdrop-blur-xl">
        No questions available for this quiz.
      </div>
    );
  }

  if (completed) {
    const percentage = totalQuestions
      ? Math.round((score / totalQuestions) * 100)
      : 0;

    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {sectionTitle ? `${sectionTitle} - ` : ""}
            {quiz?.title ?? fallbackTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You answered {score} of {totalQuestions} correctly ({percentage}
            %).
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {review.map((item, index) => (
            <div
              key={item.key || index}
              className={`rounded-lg border p-4 ${
                item.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="font-medium text-gray-900">
                  Question {index + 1}
                </p>
                {item.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {item.questionText && item.questionText.includes("<") ? (
                  <FormattedText content={item.questionText} />
                ) : (
                  item.questionText
                )}
              </div>
              <div className="mt-3 text-sm">
                <span className="font-medium text-gray-700">Your answer: </span>
                  <span
                    className={
                      item.isCorrect ? "text-green-700" : "text-red-700"
                    }
                  >
                    {item.userAnswer || "No answer"}
                  </span>
                </div>
              {!item.isCorrect && (
                <div className="mt-1 text-sm text-gray-700">
                  <span className="font-medium">Correct answer: </span>
                  <span className="text-green-700">
                    {item.correctAnswer && item.correctAnswer.includes("<") ? (
                      <FormattedText content={item.correctAnswer} className="inline" />
                    ) : (
                      item.correctAnswer || "Not provided"
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const questionText = extractQuestionText(currentQuestion);
    const options = currentQuestion.quiz_options ?? [];

    return (
      <>
        <div className="mb-4 text-gray-800">
          {questionText && questionText.includes("<") ? (
            <FormattedText content={questionText} />
          ) : (
            <p>{questionText || "Question unavailable."}</p>
          )}
        </div>

        {currentQuestion.type === "text" ? (
          <div className="space-y-3">
            <textarea
              value={selectedAnswer[0] ?? ""}
              onChange={(event) => updateAnswer([event.target.value])}
              placeholder="Type your answer here..."
              className="min-h-[120px] w-full resize-none rounded-lg border border-gray-300 p-4 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        ) : options.length > 0 ? (
          <div className="space-y-3">
            {options.map((option, optionIndex) => {
              const optionText = option?.text ?? "";
              const optionLetter = String.fromCharCode(65 + optionIndex);
              const isSelected = selectedAnswer.includes(optionText);

              return (
                <div
                  key={option?.id ?? optionIndex}
                  role="button"
                  tabIndex={0}
                  onClick={() => updateAnswer([optionText])}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      updateAnswer([optionText]);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">
                    <strong>{optionLetter})</strong>{" "}
                    {optionText && optionText.includes("<") ? (
                      <FormattedText content={optionText} className="inline" />
                    ) : (
                      optionText || "Option"
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            No answer options provided for this question.
          </div>
        )}
      </>
    );
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-xl">
      <div className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {sectionTitle ? `${sectionTitle} - ` : ""}
              {quiz?.title ?? fallbackTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          {headerAccessory ? (
            <div className="flex items-center justify-end">{headerAccessory}</div>
          ) : null}
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {renderQuestionContent()}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <button
            onClick={goNext}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            {currentIndex === totalQuestions - 1 ? "Submit Quiz" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
