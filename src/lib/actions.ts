"use server";

import { apiGet, apiPost } from "./api";

export async function getQuizAction(quizId: string) {
  return apiGet(`/v1/quizzes/${quizId}`);
}

export async function generateSectionExercisesAction(sectionData: {
  sectionId: string;
  courseId: string;
  subjectId: string;
  sectionTitle: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  exerciseType?: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry' | 'power_bi';
  questionCount?: number;
  userId?: string;
}) {
  return apiPost(`/v1/sections/${sectionData.sectionId}/generate-exercises`, {
    courseId: sectionData.courseId,
    subjectId: sectionData.subjectId,
    sectionTitle: sectionData.sectionTitle,
    difficulty: sectionData.difficulty,
    exerciseType: sectionData.exerciseType,
    questionCount: sectionData.questionCount,
    userId: sectionData.userId,
  });
}

export async function generateSectionQuizAction(sectionData: {
  sectionId: string;
  courseId: string;
  subjectId: string;
  sectionTitle: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  questionCount?: number;
  questionTypes?: string[];
  prevQuizResult?: {
    score: number;
    answers: Record<string, any>;
    feedback?: string;
    stop?: boolean;
  };
}) {
  const body = {
    courseId: sectionData.courseId,
    subjectId: sectionData.subjectId,
    sectionTitle: sectionData.sectionTitle,
    difficulty: sectionData.difficulty,
    questionCount: sectionData.questionCount,
    questionTypes: sectionData.questionTypes,
    ...sectionData.prevQuizResult && { prevQuizResult: sectionData.prevQuizResult },
  };

  return apiPost(`/v1/sections/${sectionData.sectionId}/generate-quiz`, body);
}

export async function getSectionExercisesAction(sectionId: string) {
  return apiGet(`/v1/sections/${sectionId}/exercises`);
}

export async function getSectionQuizzesAction(sectionId: string) {
  return apiGet(`/v1/sections/${sectionId}/quizzes`);
}

export async function getExerciseDatasetsAction(exerciseId: string) {
  return apiGet(`/v1/practice-exercises/${exerciseId}/datasets`);
}

// Adaptive Quiz Actions
export async function startAdaptiveQuizAction(quizData: {
  courseId: string;
  subjectId: string;
  sectionId: string;
  sectionTitle: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  targetLength?: number;
}) {
  return apiPost(`/v1/adaptive-quiz/start`, quizData);
}

export async function resumeAdaptiveQuizAction(data?: {
  sectionId?: string;
}) {
  return apiPost(`/v1/adaptive-quiz/resume`, data ?? {});
}

export async function checkAdaptiveQuizStatusAction(sectionId: string) {
  return apiPost(`/v1/adaptive-quiz/check-status`, { sectionId });
}

export async function getNextQuestionAction(data: {
  sessionId: string;
  previousAnswer?: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
  };
}) {
  return apiPost(`/v1/adaptive-quiz/next-question`, data);
}

export async function getAdaptiveQuizSummaryAction(sessionId: string) {
  return apiPost(`/v1/adaptive-quiz/summary`, { sessionId });
}

// Exercise Question Submission Actions
export async function getUserSectionExercisesAction(sectionId: string) {
  return apiGet(`/v1/sections/${sectionId}/user-exercises`);
}

export async function getExerciseProgressAction(exerciseId: string) {
  return apiGet(`/v1/sections/exercises/${exerciseId}/progress`);
}

export async function submitQuestionAnswerAction(data: {
  exerciseId: string;
  questionId: string;
  userAnswer: string;
  timeSpent?: number;
}) {
  return apiPost(
    `/v1/sections/exercises/${data.exerciseId}/questions/${data.questionId}/submit`,
    {
      userAnswer: data.userAnswer,
      timeSpent: data.timeSpent,
    }
  );
}

export async function getQuestionDatasetAction(questionId: string) {
  return apiGet(`/v1/sections/questions/${questionId}/dataset`);
}
