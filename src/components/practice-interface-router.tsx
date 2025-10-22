"use client";

import { useState, useEffect } from "react";
import { PythonPracticeInterface } from "./python-practice-interface";
import { SqlPracticeInterface } from "./sql-practice-interface";
import { PracticeCodingInterface } from "./practice-coding-interface";

type ExecutionResult = {
  success: boolean;
  passed: boolean;
  score: number;
  total_points: number;
  test_results: any[];
  overall_result: {
    stdout: string;
    stderr: string;
    execution_time: number;
    memory_used: number;
    exit_code: number;
  };
  attempt_id?: string;
};

interface PracticeInterfaceRouterProps {
  exerciseId: string;
  questionId: string;
  initialCode?: string;
  title: string;
  description: string;
  subjectType?: string;
  language?: string;
  onSubmit?: (result: ExecutionResult) => void;
}

/**
 * Router component that selects the appropriate practice interface
 * based on the subject type or language
 */
export function PracticeInterfaceRouter({
  exerciseId,
  questionId,
  initialCode = "",
  title,
  description,
  subjectType = 'python',
  language = 'python',
  onSubmit
}: PracticeInterfaceRouterProps) {
  // Determine which interface to use
  const effectiveLanguage = language || subjectType;
  const normalizedLanguage = (effectiveLanguage ?? '').toLowerCase();
  const normalizedSubjectType = (subjectType ?? '').toLowerCase();
  const useSqlInterface =
    normalizedLanguage === 'sql' || normalizedSubjectType === 'sql';
  const usePythonInterface =
    normalizedLanguage === 'python' ||
    normalizedSubjectType === 'python' ||
    normalizedSubjectType === 'statistics';

  // Route to appropriate interface
  if (useSqlInterface) {
    return (
      <SqlPracticeInterface
        exerciseId={exerciseId}
        questionId={questionId}
        initialCode={initialCode}
        title={title}
        description={description}
        onSubmit={onSubmit}
      />
    );
  }

  if (usePythonInterface) {
    return (
      <PythonPracticeInterface
        exerciseId={exerciseId}
        questionId={questionId}
        initialCode={initialCode}
        title={title}
        description={description}
        subjectType={
          normalizedSubjectType === 'statistics' ? 'statistics' : 'python'
        }
        onSubmit={onSubmit}
      />
    );
  }

  // For other languages, use the generic practice coding interface
  // (which uses server-side execution via Piston)
  return (
    <PracticeCodingInterface
      exerciseId={exerciseId}
      questionId={questionId}
      initialCode={initialCode}
      title={title}
      description={description}
      subjectType={subjectType}
      onSubmit={onSubmit}
    />
  );
}
