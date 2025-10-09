"use client";
import {
  getQuizAction,
  generateSectionExercisesAction,
  generateSectionQuizAction,
  getSectionExercisesAction,
  getSectionQuizzesAction,
  getExerciseDatasetsAction,
  startAdaptiveQuizAction,
  getNextQuestionAction,
  getAdaptiveQuizSummaryAction,
  getExerciseProgressAction,
} from "@/lib/actions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { ProfessionalCourseTabs } from "@/components/professional-course-tabs";
import { PracticeArea } from "@/components/practice-area";
import { useVideoState } from "@/hooks/use-video-state";
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useDuckDB } from "@/hooks/use-duckdb";

import {
  Activity,
  BookOpen,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code,
  FileText,
  Play,
} from "lucide-react";

type Lecture = { id?: string; title?: string; content?: string; type?: string };

type PracticeExerciseQuestion = {
  id: string;
  exercise_id: string;
  question_text: string;
  question_type: 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
  text?: string;
  options?: any;
  correct_answer?: any;
  solution?: string;
  created_at: string;
  updated_at: string;
  dataset?: string | Record<string, unknown>;
}

type Exercise = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: PracticeExerciseQuestion[];
  section_exercise_questions?: PracticeExerciseQuestion[];
  dataset?: string | Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type QuizQuestionOption = { id?: string; text?: string; correct?: boolean };

type QuizQuestion = {
  id?: string;
  type?: string;
  text?: string;
  order_index?: number;
  content?: string;
  quiz_options?: QuizQuestionOption[];
};

type Quiz = {
  id?: string;
  title?: string;
  quiz_questions?: QuizQuestion[];
  type?: string;
};

type Dataset = {
  id: string;
  name: string;
  table_name?: string;
  columns?: string[];
  data?: any[];
  description?: string;
  placeholders?: string[];
};

type GeneratedExerciseResponse = {
  exercise: Exercise;
  questions: PracticeExerciseQuestion[];
  context: {
    header_text: string;
    business_context: string;
    dataset_description: string;
    data_dictionary: Record<string, string>;
    questions_raw: Array<{
      id: number;
      business_question: string;
      topics: string[];
      difficulty: string;
      adaptive_note: string;
    }>;
    expected_cols_list: string[][];
    data_creation_sql?: string;
    answers_sql_map: Record<number, string>;
    verification: Array<{
      question: number;
      columns: string[];
      rows_preview: string[][];
      columns_match_expected: boolean;
      returns_rows: boolean;
      ok: boolean;
      error?: string;
    }>;
  };
};

type Section = {
  id: string;
  title: string;
  overview?: string;
  lecture?: Lecture | null;
  lectures?: Lecture[];
  exercises?: Exercise[];
  quizzes?: Quiz[];
};

type Module = { id?: string; slug?: string; title: string; subjectId?: string; sections?: Section[] };

type ResourceKind = "lecture" | "exercise" | "quiz";

type SelectedResource = { sectionId: string; kind: ResourceKind; resourceId?: string };

const resourceLabels: Record<ResourceKind, string> = {
  lecture: "Lecture Video",
  exercise: "Practice Exercise",
  quiz: "Section Quiz",
};

const getExerciseQuestionKey = (question: any, fallbackIndex: number): string => {
  const normalizedIndex = fallbackIndex >= 0 ? fallbackIndex : 0;
  if (!question) {
    return `question-${normalizedIndex}`;
  }

  if (question.id !== undefined && question.id !== null) {
    return String(question.id);
  }

  if ((question as any).question_id !== undefined && (question as any).question_id !== null) {
    return String((question as any).question_id);
  }

  if (
    (question as any).exercise_id !== undefined &&
    (question as any).exercise_id !== null &&
    (question as any).order_index !== undefined
  ) {
    return `${(question as any).exercise_id}-${(question as any).order_index}`;
  }

  if ((question as any).order_index !== undefined && (question as any).order_index !== null) {
    return `order-${(question as any).order_index}`;
  }

  const textSource =
    typeof question.question_text === "string"
      ? question.question_text
      : typeof question.text === "string"
      ? question.text
      : "";

  if (textSource) {
    return `${normalizedIndex}-${textSource.slice(0, 20)}`;
  }

  return `question-${normalizedIndex}`;
};

const normalizeCreationSql = (value?: string | null): string | undefined => {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  let normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return undefined;
  }

  const fencedMatch = normalized.match(/^```[\w+-]*\n([\s\S]*?)\n```$/i);
  if (fencedMatch) {
    normalized = fencedMatch[1].trim();
  } else {
    normalized = normalized.replace(/^```[\w+-]*\s*/i, "").trim();
    normalized = normalized.replace(/\s*```[\w+-]*$/i, "").trim();
  }

  normalized = normalized.replace(/\s*```[\w+-]*\s*$/gi, "").trim();
  normalized = normalized.replace(/\s+```[\w+-]*\s*/gi, " ").trim();

  return normalized || undefined;
};

const normalizeSectionExerciseQuestion = (
  question: any,
  options: { exerciseId?: string; fallbackIndex?: number } = {},
) => {
  const { exerciseId, fallbackIndex } = options;
  const rawId =
    question?.id ??
    question?.question_id ??
    question?.questionId ??
    (typeof fallbackIndex === "number" && exerciseId
      ? `${exerciseId}-${fallbackIndex}`
      : fallbackIndex ?? null);

  const normalizedId =
    typeof rawId === "number"
      ? String(rawId)
      : typeof rawId === "string" && rawId
      ? rawId
      : `question-${fallbackIndex ?? 0}`;

  const rawText = typeof question?.text === "string" ? question.text.trim() : "";
  const fallbackText =
    typeof question?.question_text === "string" ? question.question_text.trim() : "";
  const normalizedText = rawText || fallbackText || "";

  const rawType =
    typeof question?.question_type === "string" && question.question_type.trim()
      ? question.question_type
      : typeof question?.type === "string" && question.type.trim()
      ? question.type
      : "sql";
  const normalizedType =
    typeof rawType === "string" && rawType.trim() ? rawType.toLowerCase() : "sql";

  const derivedExerciseId =
    question?.exercise_id ??
    question?.exerciseId ??
    (typeof exerciseId === "string" ? exerciseId : undefined);

  const normalizedExerciseId =
    typeof derivedExerciseId === "string" && derivedExerciseId
      ? derivedExerciseId
      : typeof derivedExerciseId === "number"
      ? String(derivedExerciseId)
      : typeof exerciseId === "string"
      ? exerciseId
      : undefined;

  const normalizedOrderIndex =
    typeof question?.order_index === "number"
      ? question.order_index
      : typeof fallbackIndex === "number"
      ? fallbackIndex
      : 0;

  return {
    ...question,
    id: normalizedId,
    dataset: normalizeCreationSql(question?.dataset),
    creation_sql: normalizeCreationSql(
      question?.creation_sql ?? question?.dataset ?? question?.sql,
    ),
    text: normalizedText,
    question_text: normalizedText,
    question_type: normalizedType,
    type: normalizedType,
    exercise_id: normalizedExerciseId,
    order_index: normalizedOrderIndex,
  };
};


const FALLBACK_SOURCES: string[] = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://iframe.mediadelivery.net/play/243528/c28b69a3-5301-455f-ab5a-9d24c4fef2da",
  "https://iframe.mediadelivery.net/play/243528/da4481d9-69c5-4fc4-aa1f-54f84c83a85f",
  "https://iframe.mediadelivery.net/play/243528/ff8d7d62-bdb8-46f2-ae92-ae12e6ad77bf",
  "https://iframe.mediadelivery.net/play/243528/3f874639-8a68-47b9-aabb-9e28af35120b",

  `# Introduction to Data Analysis

## Overview

This comprehensive lesson covers the fundamentals of data analysis, including:

- Data collection and preparation methods

- Statistical analysis techniques

- Data visualization best practices

- Common pitfalls and how to avoid them

## Learning Objectives

By the end of this lesson, you will be able to:

1. Understand different types of data and their characteristics

2. Apply appropriate analytical techniques for your dataset

3. Create meaningful visualizations to communicate insights

4. Validate your findings and ensure accuracy`,

  `# Advanced SQL Techniques

## Window Functions

Window functions allow you to perform calculations across a set of table rows related to the current row:

\`\`\`sql

SELECT 

  employee_name,

  salary,

  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary

FROM employees;

\`\`\`

## Key Concepts

- OVER clause defines the window

- PARTITION BY groups rows

- ORDER BY defines sequence within partition

## Practice Exercises

Complete the following exercises to reinforce your understanding.`,

  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",

  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",

];

const getLectures = (section?: Section | null): Lecture[] => {
  if (!section) return [];
  const lectureList = Array.isArray(section.lectures)
    ? section.lectures.filter((lecture): lecture is Lecture => Boolean(lecture))
    : [];
  const fallbackLecture = section.lecture;
  if (fallbackLecture) {
    const hasSameId = fallbackLecture.id
      ? lectureList.some((lecture) => lecture.id === fallbackLecture.id)
      : false;
    if (!hasSameId) {
      return [fallbackLecture, ...lectureList];
    }
  }
  return lectureList;
};

const getLectureKey = (lecture: Lecture, index: number) => lecture.id ?? `lecture-${index}`;

const getExercises = (section?: Section | null): Exercise[] => {

  if (!section || !Array.isArray(section.exercises)) return [];

  return section.exercises.filter(Boolean);

};

const getQuizzes = (section?: Section | null): Quiz[] => {

  if (!section || !Array.isArray(section.quizzes)) return [];

  return section.quizzes.filter(Boolean);

};

const getDefaultResource = (section?: Section | null): SelectedResource | null => {

  if (!section) return null;

  const lectures = getLectures(section);

  if (lectures.length) {

    return {

      sectionId: section.id,

      kind: "lecture",

      resourceId: getLectureKey(lectures[0], 0),

    };

  }


  const exercises = getExercises(section);

  if (exercises.length) {

    return { sectionId: section.id, kind: "exercise", resourceId: exercises[0]?.id };

  }

  const quizzes = getQuizzes(section);

  if (quizzes.length) {

    return { sectionId: section.id, kind: "quiz", resourceId: quizzes[0]?.id };

  }

  return null;

};

export function SubjectLearningInterface({
  trackTitle,
  subjectTitle,
  subjectModules,
  completedSections,
  totalSections,
  courseId,
  subjectId,
  initialModuleSlug,
}: {
  trackTitle: string;
  subjectTitle?: string | null;
  subjectModules: Module[];
  completedSections: number;
  totalSections: number;
  courseId: string;
  subjectId: string;
  initialModuleSlug?: string;
}) {

  const allSections = useMemo(
    () => (subjectModules || []).flatMap((module) => module.sections || []),
    [subjectModules]
  );

  console.log("All Sections:", allSections);

  const getModuleIdentifier = useCallback((module: Module | undefined) => {
    if (!module) return undefined;
    if (typeof module.slug === "string" && module.slug) return module.slug;
    if (typeof module.id === "string" && module.id) return module.id;
    return undefined;

  }, []);

  const sectionToModuleSlug = useMemo(() => {

    const mapping = new Map<string, string>();

    (subjectModules || []).forEach((module) => {

      const moduleSlug = getModuleIdentifier(module);

      if (!moduleSlug) return;

      (module.sections || []).forEach((section) => {

        if (section?.id) {

          mapping.set(section.id, moduleSlug);

        }

      });

    });

    return mapping;

  }, [subjectModules, getModuleIdentifier]);

  const findFirstSectionIdForModule = useCallback(
    (moduleSlug?: string) => {
      if (!moduleSlug) return undefined;
      const targetModule = (subjectModules || []).find(
        (module) => getModuleIdentifier(module) === moduleSlug
      );
      if (!targetModule) return undefined;
      const sections = Array.isArray(targetModule.sections) ? targetModule.sections : [];
      const firstSection = sections.find((section) => Boolean(section?.id));
      return firstSection?.id;
    },
    [subjectModules, getModuleIdentifier]
  );

  const deriveInitialSectionId = useCallback(() => {
    const preferredSectionId = findFirstSectionIdForModule(initialModuleSlug);
    if (preferredSectionId) return preferredSectionId;
    return allSections[0]?.id;
  }, [findFirstSectionIdForModule, initialModuleSlug, allSections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(() => deriveInitialSectionId());

  const selectedSection: Section | undefined = useMemo(
    () => allSections.find((section) => section.id === selectedSectionId),

    [allSections, selectedSectionId]

  );

  const defaultSelectedResource = useMemo(() => getDefaultResource(selectedSection), [selectedSection]);

  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(() => defaultSelectedResource);

  const mainContentRef = useRef<HTMLDivElement | null>(null);

  const sectionRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  // Quiz state
  const [loadedQuiz, setLoadedQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);

  // Section quizzes state
  const [sectionQuizzes, setSectionQuizzes] = useState<{ [sectionId: string]: Quiz[] }>({});
  const [loadingSectionQuizzes, setLoadingSectionQuizzes] = useState<Record<string, boolean>>({});

  // Quiz runner state
  const [isQuizRunnerMode, setIsQuizRunnerMode] = useState(false);
  const [currentSectionQuizIndex, setCurrentSectionQuizIndex] = useState(0);
  const [quizSession, setQuizSession] = useState<{
    quizzes: Quiz[];
    currentQuizId?: string;
    prevResult: { score: number; answers: Record<string, any>; stop: boolean } | null;
    currentSectionQuizIndex: number;
  } | null>(null);

  // Generation state
  const [generatingExercise, setGeneratingExercise] = useState<Record<string, boolean>>({});
  const [generatingQuiz, setGeneratingQuiz] = useState<Record<string, boolean>>({});

  // Content generation loading state
  const isGeneratingContentForSection = selectedSectionId
    ? generatingExercise[selectedSectionId] || generatingQuiz[selectedSectionId]
    : false;

  // Progressive generation state
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Exercise data state
  const [currentExerciseData, setCurrentExerciseData] = useState<GeneratedExerciseResponse | null>(null);

  // Section exercises state
  const [sectionExercises, setSectionExercises] = useState<{ [sectionId: string]: any[] }>({});
  const [loadingSectionExercises, setLoadingSectionExercises] = useState<Record<string, boolean>>({});

  // Question popup state
  const [selectedQuestionForPopup, setSelectedQuestionForPopup] = useState<any>(null);

  // Floating video player state
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);
  const [isMainVideoFocused, setIsMainVideoFocused] = useState(false);
  const [isFloatingPlayerManuallyClosed, setIsFloatingPlayerManuallyClosed] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const manualCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showFloatingPlayerRef = useRef(false);
  showFloatingPlayerRef.current = showFloatingPlayer;

  // Stabilize floating state to avoid focus flicker
  useEffect(() => {
    if (!showFloatingPlayer) {
      return;
    }
    if (videoFocusTimeoutRef.current) {
      clearTimeout(videoFocusTimeoutRef.current);
      videoFocusTimeoutRef.current = null;
    }
    setIsMainVideoFocused(false);
  }, [showFloatingPlayer]);

  // Video state management
  const {
    videoState,
    updateCurrentTime,
    updatePlayState,
    updateDuration,
    setVideoRef,
    syncVideoTime,
    syncPlayState,
  } = useVideoState();

  // Handle video focus/blur events
  const handleVideoFocus = useCallback(() => {
    if (showFloatingPlayerRef.current) return;
    // console.log('Video focused - hiding floating player');
    setIsMainVideoFocused(true);
  }, []);

  const handleVideoBlur = useCallback(() => {
    if (showFloatingPlayerRef.current) return;
    // console.log('Video blurred - can show floating player');
    setIsMainVideoFocused(false);
  }, []);

  // Handle video container interactions
  const handleVideoContainerMouseEnter = useCallback(() => {
    if (showFloatingPlayerRef.current) return;
    // console.log('Video container mouse enter - hiding floating player');
    // Clear any pending timeout
    if (videoFocusTimeoutRef.current) {
      clearTimeout(videoFocusTimeoutRef.current);
      videoFocusTimeoutRef.current = null;
    }
    setIsMainVideoFocused(true);
  }, []);

  const handleVideoContainerMouseLeave = useCallback(() => {
    if (showFloatingPlayerRef.current) return;
    // console.log('Video container mouse leave - can show floating player after delay');
    // Set a timeout before allowing floating player to show
    videoFocusTimeoutRef.current = setTimeout(() => {
      // console.log('Video focus timeout - can show floating player');
      setIsMainVideoFocused(false);
      videoFocusTimeoutRef.current = null;
    }, 500); // 500ms delay
  }, []);

  const handleVideoContainerClick = useCallback(() => {
    if (showFloatingPlayerRef.current) return;
    // console.log('Video container clicked - hiding floating player');
    // Clear any pending timeout
    if (videoFocusTimeoutRef.current) {
      clearTimeout(videoFocusTimeoutRef.current);
      videoFocusTimeoutRef.current = null;
    }
    setIsMainVideoFocused(true);
  }, []);

  // Custom video ref callback to add focus listeners
  const handleVideoRef = useCallback((videoElement: HTMLVideoElement | null) => {
    setVideoRef(videoElement);

    if (videoElement) {
      videoElement.addEventListener('focus', handleVideoFocus);
      videoElement.addEventListener('blur', handleVideoBlur);
      videoElement.setAttribute('tabIndex', '-1'); // Make video focusable
    }
  }, [handleVideoFocus, handleVideoBlur, setVideoRef]);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);

  // SQL execution state
  const [sqlCode, setSqlCode] = useState<string>('');
  const [sqlResults, setSqlResults] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState<string>('');
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const duckdb = useDuckDB();
  const {
    isReady: isDuckDbReady,
    isLoading: isDuckDbLoading,
    error: duckDbError,
    executeQuery: executeDuckDbQuery,
    loadDataset: loadDuckDbDataset,
  } = duckdb;
  const [isPreparingDuckDb, setIsPreparingDuckDb] = useState(false);
  const [duckDbSetupError, setDuckDbSetupError] = useState<string | null>(null);
  const [duckDbTables, setDuckDbTables] = useState<string[]>([]);

  // Dataset state
  const [exerciseDatasets, setExerciseDatasets] = useState<{ [exerciseId: string]: any[] }>({});
  const [loadingExerciseDatasets, setLoadingExerciseDatasets] = useState<Record<string, boolean>>({});
  const [questionDataset, setQuestionDataset] = useState<any>(null);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [questionCompletionStatus, setQuestionCompletionStatus] = useState<Record<string, "pending" | "completed">>({});

  // Adaptive Quiz state
  const [isAdaptiveQuizMode, setIsAdaptiveQuizMode] = useState(false);
  const [adaptiveQuizSession, setAdaptiveQuizSession] = useState<any>(null);
  const [currentAdaptiveQuestion, setCurrentAdaptiveQuestion] = useState<any>(null);
  const [adaptiveQuizAnswer, setAdaptiveQuizAnswer] = useState<string>('');
  const [adaptiveQuizCompleted, setAdaptiveQuizCompleted] = useState(false);
  const [adaptiveQuizSummary, setAdaptiveQuizSummary] = useState<any>(null);
  const [submittingAdaptiveAnswer, setSubmittingAdaptiveAnswer] = useState(false);
  const [pendingAdaptiveQuestion, setPendingAdaptiveQuestion] = useState<any>(null);

  // Authentication state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get session token and userId from Supabase
  useEffect(() => {
    const getSession = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setSessionToken(session.access_token);
        }
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      }
    };
    
    getSession();
  }, []);
  const [showAdaptiveExplanation, setShowAdaptiveExplanation] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Practice Mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [selectedPracticeExercise, setSelectedPracticeExercise] = useState<any>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [practiceDatasets, setPracticeDatasets] = useState<any[]>([]);

  const selectedQuestionType = useMemo(() => {
    if (!selectedQuestionForPopup) {
      return null;
    }
    const rawType =
      (selectedQuestionForPopup as any)?.question_type ||
      (selectedQuestionForPopup as any)?.type ||
      "sql";
    return typeof rawType === "string" ? rawType.toLowerCase() : null;
  }, [selectedQuestionForPopup]);


  // Function to fetch exercise datasets
  const fetchExerciseDatasets = useCallback(async (exerciseId: string) => {
    if (loadingExerciseDatasets[exerciseId] || exerciseDatasets[exerciseId]) return;

    setLoadingExerciseDatasets(prev => ({ ...prev, [exerciseId]: true }));
    try {
      const response = await getExerciseDatasetsAction(exerciseId) as any;
      if (response && response.data) {
        const normalizedDatasets = Array.isArray(response.data)
          ? response.data.map((dataset: any) => ({
              ...dataset,
              creation_sql: normalizeCreationSql(dataset?.creation_sql ?? dataset?.sql ?? dataset?.dataset),
            }))
          : [];
        setExerciseDatasets(prev => ({
          ...prev,
          [exerciseId]: normalizedDatasets
        }));
        // console.log('Fetched datasets for exercise:', exerciseId, normalizedDatasets);
      }
    } catch (error) {
      console.error('Failed to fetch exercise datasets:', error);
    } finally {
      setLoadingExerciseDatasets(prev => ({ ...prev, [exerciseId]: false }));
    }
  }, [loadingExerciseDatasets, exerciseDatasets]);

  // Function to fetch section quizzes
  const fetchSectionQuizzes = useCallback(async (sectionId: string) => {
    if (loadingSectionQuizzes[sectionId] || sectionQuizzes[sectionId]) return;

    setLoadingSectionQuizzes(prev => ({ ...prev, [sectionId]: true }));
    try {
      const response = await getSectionQuizzesAction(sectionId) as any;
      if (response && response.data) {
        setSectionQuizzes(prev => ({
          ...prev,
          [sectionId]: response.data
        }));
        // console.log('Fetched quizzes for section:', sectionId, response.data);
      }
    } catch (error) {
      console.error('Failed to fetch section quizzes:', error);
    } finally {
      setLoadingSectionQuizzes(prev => ({ ...prev, [sectionId]: false }));
    }
  }, [loadingSectionQuizzes, sectionQuizzes]);

  // SQL execution will be handled by backend API

  // Database initialization is now handled by backend API

  const autoScrollArmedRef = useRef(Boolean(initialModuleSlug));

  // Function to fetch section exercises
  const fetchSectionExercises = useCallback(async (sectionId: string) => {
    // console.log('[FETCH EXERCISES DEBUG] Called for section:', sectionId, {
    //   alreadyLoading: loadingSectionExercises[sectionId],
    //   alreadyLoaded: !!sectionExercises[sectionId],
    //   currentState: sectionExercises
    // });
    
    if (loadingSectionExercises[sectionId] || sectionExercises[sectionId]) {
      // console.log('[FETCH EXERCISES DEBUG] Early return - already loading or loaded');
      return;
    }

    setLoadingSectionExercises(prev => ({ ...prev, [sectionId]: true }));
    try {
      const response = await getSectionExercisesAction(sectionId) as any;
      // console.log('[FETCH EXERCISES DEBUG] API response:', response);
      if (response && response.data) {
        const normalizedExercises = Array.isArray(response.data)
          ? response.data.map((exercise: any) => ({
              ...exercise,
              // Map 'data' field from backend to 'dataset' field expected by frontend
              dataset: normalizeCreationSql(exercise?.data),
              section_exercise_questions: Array.isArray(exercise?.section_exercise_questions)
                ? exercise.section_exercise_questions.map((question: any, index: number) =>
                    normalizeSectionExerciseQuestion(question, {
                      exerciseId: exercise?.id ? String(exercise.id) : undefined,
                      fallbackIndex: index,
                    }),
                  )
                : exercise?.section_exercise_questions,
              context: exercise?.context
                ? {
                    ...exercise.context,
                    data_creation_sql: normalizeCreationSql(exercise.context.data_creation_sql),
                  }
                : exercise?.context,
            }))
          : [];

        // console.log('[FETCH EXERCISES DEBUG] Exercises data:', normalizedExercises.map((e: any) => ({
        //   id: e.id,
        //   title: e.title,
        //   questionsCount: e.section_exercise_questions?.length || 0,
        //   questions: e.section_exercise_questions
        // })));
        setSectionExercises(prev => {
          const newState = {
            ...prev,
            [sectionId]: normalizedExercises
          };
          // console.log('[FETCH EXERCISES DEBUG] State updated. New state:', newState);
          return newState;
        });
      }
    } catch (error) {
      console.error('[FETCH EXERCISES DEBUG] Failed to fetch section exercises:', error);
    } finally {
      setLoadingSectionExercises(prev => ({ ...prev, [sectionId]: false }));
    }
  }, [loadingSectionExercises, sectionExercises]);

  // Subject-to-exercise-type mapping
  const getExerciseTypeBySubject = useCallback((subjectTitle?: string | null) => {
    if (!subjectTitle) return 'sql';
    
    const subject = subjectTitle.toLowerCase();
    
    // Python related subjects
    if (subject.includes('python') || subject.includes('programming') || subject.includes('coding')) {
      return 'python';
    }
    
    // SQL related subjects  
    if (subject.includes('sql') || subject.includes('database') || subject.includes('data')) {
      return 'sql';
    }
    
    // Statistics related subjects
    if (subject.includes('statistics') || subject.includes('statistical') || subject.includes('math')) {
      return 'statistics';
    }
    
    // Google Sheets related subjects
    if (subject.includes('sheet') || subject.includes('excel') || subject.includes('spreadsheet')) {
      return 'google_sheets';
    }
    
  // Default to sql
    return 'sql';
  }, []);

  const fetchQuestionDataset = useCallback(async (questionId: string) => {
    if (!questionId) return;

    setLoadingDataset(true);
    try {
      const response = await fetch(`/api/v1/sections/questions/${questionId}/dataset`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // No dataset persisted for this question yet (common for freshly-generated content)
        setQuestionDataset(null);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        const normalizedDataset = result?.data
          ? {
              ...result.data,
              creation_sql: normalizeCreationSql(result.data.creation_sql ?? result.data.sql),
              dataset:
                typeof result.data.dataset === "string"
                  ? normalizeCreationSql(result.data.dataset)
                  : result.data.dataset,
              schema_info: result.data.schema_info
                ? {
                    ...result.data.schema_info,
                    creation_sql: normalizeCreationSql(result.data.schema_info.creation_sql),
                  }
                : result.data.schema_info,
            }
          : null;
        setQuestionDataset(normalizedDataset);
        // console.log('Fetched dataset for question:', questionId, normalizedDataset);
      } else {
        console.error('Failed to fetch dataset:', response.statusText);
        setQuestionDataset(null);
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
      setQuestionDataset(null);
    } finally {
      setLoadingDataset(false);
    }
  }, []);

  // Generation functions with progressive loading
  const handleGenerateExercise = useCallback(async (section: Section) => {
    if (generatingExercise[section.id]) return;

    setGeneratingExercise(prev => ({ ...prev, [section.id]: true }));
    setGenerationStep('Analysing course structure...');
    setGenerationProgress(20);

    try {
      // Step 1: Getting section details
      setGenerationStep('Getting section details...');
      setGenerationProgress(40);

      // Determine exercise type based on subject
      const exerciseType = getExerciseTypeBySubject(subjectTitle);
      
      const result = await generateSectionExercisesAction({
        sectionId: section.id,
        courseId,
        subjectId,
        sectionTitle: section.title,
        difficulty: 'Beginner',
        exerciseType: exerciseType as 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry',
        questionCount: 3,
        userId: userId ?? undefined,
      }) as GeneratedExerciseResponse;

      // Step 2: Generating questions & SQL
      setGenerationStep('Generating questions & SQL...');
      setGenerationProgress(60);

      // Process the generated exercise data
      if (result && result.context) {
        const { context } = result;
        const rawQuestions = context.questions_raw || [];
        const normalizedQuestionType = (exerciseType || 'sql') as
          | 'sql'
          | 'python'
          | 'google_sheets'
          | 'statistics'
          | 'reasoning'
          | 'math'
          | 'geometry';

        // Step 3: Dataset is now stored in database during generation
        setGenerationStep('Finalizing exercise...');
        setGenerationProgress(80);

        const apiQuestions = (result.questions || []).map((question, index) => ({
          ...question,
          text: question.question_text || (rawQuestions?.[index]?.business_question ?? ''),
        }));

        const normalizedCreationSql = normalizeCreationSql(context.data_creation_sql);
        const normalizedContext = {
          ...context,
          data_creation_sql: normalizedCreationSql,
        };

        const derivedQuestions =
          apiQuestions.length > 0
            ? apiQuestions
            : rawQuestions.map((question, index) => ({
                id: `${result.exercise.id}-generated-${question.id ?? index}`,
                exercise_id: result.exercise.id,
                question_text: question.business_question,
                question_type: normalizedQuestionType,
                text: question.business_question,
                options: [],
                correct_answer: null,
                solution: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                dataset: normalizedCreationSql,
              }));

        const updatedExercise = {
          ...result.exercise,
          questions: derivedQuestions,
        };

        const normalizedExerciseEntry = {
          ...updatedExercise,
          section_exercise_questions: derivedQuestions,
          dataset: normalizedCreationSql,
          context: normalizedContext,
        };

        setCurrentExerciseData({
          ...result,
          context: normalizedContext,
          exercise: updatedExercise,
          questions: derivedQuestions,
        });

        setSectionExercises(prev => ({
          ...prev,
          [section.id]: [
            normalizedExerciseEntry,
            ...(prev[section.id]?.filter((exercise: any) => exercise.id !== updatedExercise.id) ?? []),
          ],
        }));

        setExerciseDatasets(prev => ({
          ...prev,
          [updatedExercise.id]: [
            {
              id: 'generated_dataset',
              name: updatedExercise.title || 'Generated Dataset',
              description: context.dataset_description,
              columns: context.expected_cols_list?.[0] || [],
              creation_sql: normalizedCreationSql,
              data_dictionary: context.data_dictionary,
            },
          ],
        }));

        setSelectedSectionId(section.id);
        setSelectedResource({
          sectionId: section.id,
          kind: "exercise",
          resourceId: updatedExercise.id,
        });

        const firstQuestion = derivedQuestions[0];
        if (firstQuestion) {
          setActiveExerciseQuestion(
            {
              ...firstQuestion,
              exerciseId: updatedExercise.id ? String(updatedExercise.id) : null,
              exerciseTitle: updatedExercise.title,
              exerciseDescription: updatedExercise.description,
              exerciseDataset: normalizedCreationSql,
            },
            0,
          );
          setShowQuestionPopup(false);
        } else {
          setSelectedQuestionForPopup(null);
        }
      }

      setGenerationStep('Ready to practice!');
      setGenerationProgress(100);

      // Brief delay to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // console.log('Exercise generated successfully:', result);
    } catch (error) {
      console.error('Failed to generate exercise:', error);
      setGenerationStep('Failed to generate exercise');
      setGenerationProgress(0);
    } finally {
      setGeneratingExercise(prev => ({ ...prev, [section.id]: false }));
      // Reset progress after a short delay
      setTimeout(() => {
        setGenerationStep('');
        setGenerationProgress(0);
      }, 2000);
    }
  }, [
    generatingExercise,
    generateSectionExercisesAction,
    courseId,
    subjectId,
    getExerciseTypeBySubject,
    subjectTitle,
  ]);

  // Adaptive Quiz Handlers
  const handleStartAdaptiveQuiz = useCallback(async (section: Section) => {
    if (generatingQuiz[section.id] || isAdaptiveQuizMode) return;

    setGeneratingQuiz(prev => ({ ...prev, [section.id]: true }));
    try {
      const result = await startAdaptiveQuizAction({
        courseId,
        subjectId,
        sectionId: section.id,
        sectionTitle: section.title || '',
        difficulty: 'Beginner',
        targetLength: 10,
      }) as any;

      if (result && result.session && result.firstQuestion && !result.stop) {
        setAdaptiveQuizSession(result.session);
        setCurrentAdaptiveQuestion(result.firstQuestion);
        setIsAdaptiveQuizMode(true);
        setAdaptiveQuizCompleted(false);
        setAdaptiveQuizAnswer('');
        setPendingAdaptiveQuestion(null);
        setSubmittingAdaptiveAnswer(false);
        setShowAdaptiveExplanation(false);
        setLastAnswerCorrect(null);
        setAdaptiveQuizSummary(null);
      } else if (result?.stop) {
        console.log('Quiz stopped immediately');
      }
    } catch (error) {
      console.error('Failed to start adaptive quiz:', error);
    } finally {
      setGeneratingQuiz(prev => ({ ...prev, [section.id]: false }));
    }
  }, [generatingQuiz, courseId, subjectId, isAdaptiveQuizMode]);

  const handleAdaptiveQuizSubmit = useCallback(async () => {
    if (
      !currentAdaptiveQuestion ||
      !adaptiveQuizSession ||
      !adaptiveQuizAnswer ||
      submittingAdaptiveAnswer ||
      showAdaptiveExplanation
    ) {
      return;
    }

    setSubmittingAdaptiveAnswer(true);
    setPendingAdaptiveQuestion(null);

    try {
      // Compare labels (A, B, C, D) to determine correctness
      const selectedLabel = adaptiveQuizAnswer;
      const correctLabel = currentAdaptiveQuestion.correct_option?.label;
      const isCorrect = selectedLabel === correctLabel;

      setLastAnswerCorrect(isCorrect);
      setShowAdaptiveExplanation(true);

      const result = await getNextQuestionAction({
        sessionId: adaptiveQuizSession.id,
        previousAnswer: {
          questionId: currentAdaptiveQuestion.id,
          selectedOption: adaptiveQuizAnswer,
          isCorrect,
        },
      }) as any;

      if (result?.stop) {
        setAdaptiveQuizCompleted(true);

        const summaryResult = await getAdaptiveQuizSummaryAction(adaptiveQuizSession.id);
        if (summaryResult) {
          setAdaptiveQuizSummary(summaryResult);
        }
      } else if (result?.question) {
        setPendingAdaptiveQuestion(result.question);
      }
    } catch (error) {
      console.error('Failed to submit adaptive quiz answer:', error);
    } finally {
      setSubmittingAdaptiveAnswer(false);
    }
  }, [
    currentAdaptiveQuestion,
    adaptiveQuizSession,
    adaptiveQuizAnswer,
    submittingAdaptiveAnswer,
    showAdaptiveExplanation,
  ]);

  const handleAdaptiveQuizNext = useCallback(() => {
    if (!pendingAdaptiveQuestion) {
      return;
    }

    setCurrentAdaptiveQuestion(pendingAdaptiveQuestion);
    setPendingAdaptiveQuestion(null);
    setAdaptiveQuizAnswer('');
    setShowAdaptiveExplanation(false);
    setLastAnswerCorrect(null);
  }, [pendingAdaptiveQuestion]);

  const handleExitAdaptiveQuiz = useCallback(() => {
    setIsAdaptiveQuizMode(false);
    setAdaptiveQuizSession(null);
    setCurrentAdaptiveQuestion(null);
    setAdaptiveQuizAnswer('');
    setPendingAdaptiveQuestion(null);
    setSubmittingAdaptiveAnswer(false);
    setAdaptiveQuizCompleted(false);
    setAdaptiveQuizSummary(null);
    setShowAdaptiveExplanation(false);
    setLastAnswerCorrect(null);
  }, []);

  // Practice Mode Handlers
  const handleStartPractice = useCallback(
    async (exercise: any) => {
      if (!exercise) {
        return;
      }

      const rawQuestions = Array.isArray(exercise.section_exercise_questions) &&
        exercise.section_exercise_questions.length > 0
          ? exercise.section_exercise_questions
          : Array.isArray(exercise.questions)
          ? exercise.questions
          : [];

      if (!rawQuestions.length) {
        console.warn('No practice questions available for exercise:', exercise?.id);
        return;
      }

      const normalizedQuestions = rawQuestions.map((question: any, index: number) =>
        normalizeSectionExerciseQuestion(question, {
          exerciseId: exercise?.id ? String(exercise.id) : undefined,
          fallbackIndex: index,
        }),
      );

      const normalizedExercise = {
        ...exercise,
        dataset: normalizeCreationSql(exercise?.dataset),
        section_exercise_questions: normalizedQuestions,
      };

      setSelectedPracticeExercise(normalizedExercise);
      setPracticeQuestions(normalizedQuestions);
      setShowQuestionPopup(false);
      setSelectedQuestionForPopup(null);
      setIsPracticeMode(true);
      setPracticeDatasets([]);

      try {
        const response = (await getExerciseDatasetsAction(exercise.id)) as any;
        if (response && response.data) {
          const normalizedDatasets = Array.isArray(response.data)
            ? response.data.map((dataset: any) => ({
                ...dataset,
                creation_sql: normalizeCreationSql(
                  dataset?.creation_sql ?? dataset?.sql ?? dataset?.dataset,
                ),
              }))
            : [];
          setPracticeDatasets(normalizedDatasets);
        } else {
          setPracticeDatasets([]);
        }
      } catch (error) {
        console.error('Failed to fetch practice datasets:', error);
        setPracticeDatasets([]);
      }

      // Practice mode already enabled above
    },
    [getExerciseDatasetsAction],
  );

  const handleExitPractice = useCallback(() => {
    setIsPracticeMode(false);
    setSelectedPracticeExercise(null);
    setPracticeQuestions([]);
    setPracticeDatasets([]);
  }, []);

  const handlePracticeSubmit = useCallback(async (questionId: string, solution: string) => {
    try {
      if (!sessionToken) {
        console.error('No session token available');
        return {
          success: false,
          feedback: "Authentication required. Please refresh the page."
        };
      }

      const response = await fetch('/api/v1/practice-exercises/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && {'Authorization': `Bearer ${sessionToken}`}),
        },
        body: JSON.stringify({
          question_id: questionId,
          submitted_answer: solution,
          attempted_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          isCorrect: result.is_correct,
          feedback: result.feedback || "Solution submitted successfully!"
        };
      } else {
        console.error('Failed to submit practice attempt:', response.statusText);
        return {
          success: false,
          feedback: "Failed to submit solution. Please try again."
        };
      }
    } catch (error) {
      console.error('Error submitting practice attempt:', error);
      return {
        success: false,
        feedback: "Network error. Please check your connection and try again."
      };
    }
  }, [sessionToken]);

  const registerSectionRef = useCallback(

    (sectionId: string) => (element: HTMLButtonElement | null) => {

      if (!sectionId) return;

      if (element) {

        sectionRefs.current.set(sectionId, element);

      } else {

        sectionRefs.current.delete(sectionId);

      }

    },

    []

  );

  useEffect(() => {

    if (initialModuleSlug) {

      autoScrollArmedRef.current = true;

    }

  }, [initialModuleSlug]);

  useEffect(() => {

    if (!allSections.length) {

      setSelectedSectionId(undefined);

      return;

    }

    const preferredSectionId = deriveInitialSectionId();

    setSelectedSectionId((prev) => {

      if (prev && allSections.some((section) => section.id === prev)) {

        if (initialModuleSlug) {

          const moduleSlug = sectionToModuleSlug.get(prev);

          if (moduleSlug !== initialModuleSlug && preferredSectionId) {

            return preferredSectionId;

          }

        }

        return prev;

      }

      return preferredSectionId;

    });

  }, [allSections, deriveInitialSectionId, initialModuleSlug, sectionToModuleSlug]);

  useEffect(() => {

    if (!selectedSectionId) return;

    if (!autoScrollArmedRef.current) return;

    const targetSection = sectionRefs.current.get(selectedSectionId);

    if (targetSection) {

      targetSection.scrollIntoView({ behavior: "smooth", block: "center" });

    }

    if (mainContentRef.current) {

      mainContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

    }

    autoScrollArmedRef.current = false;

  }, [selectedSectionId]);

  useEffect(() => {

    if (!selectedSection) {

      setSelectedResource((prev) => (prev ? null : prev));

      return;

    }

    // Fetch section exercises and quizzes when a section is selected
    // console.log('[useEffect] Calling fetchSectionExercises for section:', selectedSection.id);
    fetchSectionExercises(selectedSection.id);
    // console.log('[useEffect] Calling fetchSectionQuizzes for section:', selectedSection.id);
    fetchSectionQuizzes(selectedSection.id);

    const fallbackResource = getDefaultResource(selectedSection);

    setSelectedResource((prev) => {

      if (prev && prev.sectionId === selectedSection.id) {

        if (prev.kind === "lecture") {

          const lectures = getLectures(selectedSection);

          if (!lectures.length) return fallbackResource;

          const defaultLecture = {

            sectionId: selectedSection.id,

            kind: "lecture" as const,

            resourceId: getLectureKey(lectures[0], 0),

          };

          if (!prev.resourceId) return defaultLecture;

          const hasLecture = lectures.some((lecture, index) => getLectureKey(lecture, index) === prev.resourceId);

          if (hasLecture) return prev;

          return defaultLecture;

        }

        if (prev.kind === "exercise") {
          console.log(selectedSection);
          const exercises = getExercises(selectedSection);

          if (exercises.some((exercise) => exercise.id === prev.resourceId)) return prev;

          if (exercises.length) {

            return { sectionId: selectedSection.id, kind: "exercise", resourceId: exercises[0]?.id };

          }

        }

        if (prev.kind === "quiz") {

          const quizzes = getQuizzes(selectedSection);

          if (quizzes.some((quiz) => quiz.id === prev.resourceId)) return prev;

          if (quizzes.length) {

            return { sectionId: selectedSection.id, kind: "quiz", resourceId: quizzes[0]?.id };

          }

        }

      }

      return fallbackResource;

    });

  }, [selectedSection, fetchSectionExercises, fetchSectionQuizzes]);

  // Reset quiz state when changing quizzes
  useEffect(() => {
    if (selectedResource?.kind === "quiz" && selectedResource.resourceId) {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setCurrentQuizQuestionIndex(0);
      setLoadedQuiz(null); // Reset to trigger reload
    }
  }, [selectedResource?.resourceId]);

  // Load quiz data when quiz is selected
  useEffect(() => {
    if (
      selectedResource?.kind === "quiz" &&
      selectedResource.resourceId &&
      !loadedQuiz &&
      !quizLoading
    ) {
      const loadQuiz = async () => {
        try {
          setQuizLoading(true);
          const quizData = await getQuizAction(selectedResource.resourceId as string);
          setLoadedQuiz(quizData as Quiz);
        } catch (error) {
          console.error('Failed to load quiz:', error);
        } finally {
          setQuizLoading(false);
        }
      };
      loadQuiz();
    }
  }, [selectedResource, loadedQuiz, quizLoading]);

  // Handle quiz completion in runner mode
  const handleQuizComplete = useCallback(async (sectionId: string, score: number, answers: Record<string, string[]>) => {
    const stopThreshold = 80; // Stop if score >= 80%
    const stop = score >= stopThreshold;

    // Update current quiz result locally
    const currentSession = quizSession;
    if (currentSession) {
      setQuizSession({
        ...currentSession,
        currentSectionQuizIndex: currentSession.currentSectionQuizIndex + 1,
        prevResult: {
          score,
          answers,
          stop,
        }
      });
    }

    if (stop) {
      setIsQuizRunnerMode(false);
      // console.log(`Quiz session completed with score ${score}%`);
      return;
    }

    // Generate next adaptive quiz
    const section = allSections.find(s => s.id === sectionId);
    if (!section || !currentSession) return;

    try {
      const result = await generateSectionQuizAction({
        sectionId: section.id,
        courseId,
        subjectId,
        sectionTitle: section.title,
        difficulty: score < 60 ? 'Beginner' : score < 80 ? 'Intermediate' : 'Advanced',
        questionCount: 10,
        questionTypes: ['multiple_choice', 'text'],
        prevQuizResult: {
          score,
          answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v[0] || ''])),
          stop: false,
        },
      }) as any;

      // Local update with new quiz
      const newQuiz = result.quiz as Quiz;
      const currentQuizzes = sectionQuizzes[sectionId] || [];
      const newList = [...currentQuizzes, newQuiz];
      setSectionQuizzes(prev => ({ ...prev, [sectionId]: newList }));

      const newIndex = currentSession.currentSectionQuizIndex + 1;
      setCurrentSectionQuizIndex(newIndex);
      setSelectedResource({
        sectionId,
        kind: "quiz",
        resourceId: newQuiz.id,
      });
      setQuizSession({
        quizzes: newList,
        currentQuizId: newQuiz.id,
        prevResult: {
          score,
          answers,
          stop: false,
        },
        currentSectionQuizIndex: newIndex,
      });
      setLoadedQuiz(null); // Reload new quiz
      // console.log('Next quiz generated and loaded');
    } catch (error) {
      // console.error('Failed to generate next quiz:', error);
      setIsQuizRunnerMode(false);
    }
  }, [courseId, subjectId, sectionQuizzes, allSections, quizSession]);

  const lectureSelection = useMemo(() => {

    if (

      !selectedSection ||

      !selectedResource ||

      selectedResource.kind !== "lecture" ||

      selectedResource.sectionId !== selectedSection.id

    ) {

      return null;

    }

    const lectures = getLectures(selectedSection);

    if (!lectures.length) return null;

    const targetIndex = selectedResource.resourceId

      ? lectures.findIndex((lecture, index) => getLectureKey(lecture, index) === selectedResource.resourceId)

      : 0;

    const index = targetIndex >= 0 ? targetIndex : 0;

    return { lecture: lectures[index], index };

  }, [selectedSection, selectedResource]);

  const activeLecture = lectureSelection?.lecture ?? null;

  const lectureContent = useMemo(() => {

    if (!selectedSection || !lectureSelection) {

      return null;

    }

    const { lecture, index } = lectureSelection;

    const raw = typeof lecture?.content === "string" ? lecture.content.trim() : "";

    const sectionIndex = Math.max(0, allSections.findIndex((section) => section.id === selectedSection.id));

    const fallbackIndex = (sectionIndex + index) % FALLBACK_SOURCES.length;

    return raw || FALLBACK_SOURCES[fallbackIndex];

  }, [allSections, lectureSelection, selectedSection]);

  const activeExercise = useMemo(() => {
    if (
      !selectedSection ||
      !selectedResource ||
      selectedResource.kind !== "exercise" ||
      selectedResource.sectionId !== selectedSection.id
    ) {
      return null;
    }

    const sectionExercisesForSelectedSection = selectedSection.id
      ? sectionExercises[selectedSection.id]
      : undefined;

    const exercisesSource =
      Array.isArray(sectionExercisesForSelectedSection) && sectionExercisesForSelectedSection.length > 0
        ? sectionExercisesForSelectedSection
        : getExercises(selectedSection);

    // console.log('[ACTIVE EXERCISE DEBUG]', {
    //   sectionId: selectedSection.id,
    //   resourceId: selectedResource.resourceId,
    //   fromAPI: Array.isArray(sectionExercisesForSelectedSection) && sectionExercisesForSelectedSection.length > 0,
    //   exercisesCount: exercisesSource.length,
    //   exercises: exercisesSource.map((e: any) => ({
    //     id: e.id,
    //     title: e.title,
    //     questionsCount: e.section_exercise_questions?.length || e.questions?.length || 0
    //   }))
    // });

    if (!exercisesSource.length) return null;

    if (!selectedResource.resourceId) return exercisesSource[0];

    return (
      exercisesSource.find((exercise: any) => exercise.id === selectedResource.resourceId) ||
      exercisesSource[0]
    );
  }, [selectedResource, selectedSection, sectionExercises]);

  const activeExerciseQuestions = useMemo(() => {
    if (!activeExercise) {
      return [];
    }

    const questions =
      (Array.isArray(activeExercise.section_exercise_questions) && activeExercise.section_exercise_questions.length > 0
        ? activeExercise.section_exercise_questions
        : activeExercise.questions) || [];

    return questions;
  }, [activeExercise]);

  useEffect(() => {
    if (!activeExerciseQuestions.length) {
      setQuestionCompletionStatus({});
      return;
    }

    setQuestionCompletionStatus((prev) => {
      const next: Record<string, "pending" | "completed"> = {};
      let changed = Object.keys(prev).length !== activeExerciseQuestions.length;

      activeExerciseQuestions.forEach((question, index) => {
        const key = getExerciseQuestionKey(question, index);
        const previousStatus = prev[key] === "completed" ? "completed" : "pending";
        next[key] = previousStatus;
        if (!changed && prev[key] !== previousStatus) {
          changed = true;
        }
        if (!changed && !(key in prev)) {
          changed = true;
        }
      });

      if (!changed) {
        return prev;
      }

      return next;
    });
  }, [activeExercise?.id, activeExerciseQuestions]);

  const setActiveExerciseQuestion = useCallback(
    (question: any, index: number, exerciseOverride?: any) => {
      const exerciseContext = exerciseOverride ?? activeExercise;
      if (!question || !exerciseContext) {
        return;
      }

      const exerciseDatasetSql = normalizeCreationSql(
        (question as any)?.exerciseDataset ?? exerciseContext.dataset,
      );

      setSelectedQuestionForPopup({
        ...question,
        exerciseId: exerciseContext.id ? String(exerciseContext.id) : null,
        exerciseTitle: exerciseContext.title,
        exerciseDescription: exerciseContext.description,
        exerciseDataset: exerciseDatasetSql,
        text:
          typeof (question as any)?.text === "string" && (question as any).text.trim()
            ? (question as any).text
            : typeof (question as any)?.question_text === "string"
            ? (question as any).question_text
            : "",
        question_text:
          typeof (question as any)?.question_text === "string" && (question as any).question_text.trim()
            ? (question as any).question_text
            : typeof (question as any)?.text === "string"
            ? (question as any).text
            : "",
        question_type:
          typeof (question as any)?.question_type === "string" && (question as any).question_type.trim()
            ? (question as any).question_type.toLowerCase()
            : typeof (question as any)?.type === "string" && (question as any).type.trim()
            ? (question as any).type.toLowerCase()
            : "sql",
      });
      setSqlCode('');
      setSqlResults([]);
      setSqlError('');
      setQuestionDataset(null);
      if (question.id) {
        fetchQuestionDataset(question.id);
      }
    },
    [activeExercise, fetchQuestionDataset],
  );

  const markQuestionCompleted = useCallback(
    (question: any | null) => {
      if (!question) {
        return;
      }

      if (!activeExerciseQuestions.length) {
        return;
      }

      let index = activeExerciseQuestions.findIndex((candidate, candidateIndex) => {
        const candidateKey = getExerciseQuestionKey(candidate, candidateIndex);
        const targetKey = getExerciseQuestionKey(question, candidateIndex);
        return candidateKey === targetKey;
      });

      if (index < 0 && typeof question?.order_index === "number") {
        index = activeExerciseQuestions.findIndex(
          (candidate: any) => candidate?.order_index === question.order_index,
        );
      }

      const key = getExerciseQuestionKey(question, index);

      setQuestionCompletionStatus((prev) => {
        if (prev[key] === "completed") {
          return prev;
        }
        return {
          ...prev,
          [key]: "completed",
        };
      });
    },
    [activeExerciseQuestions],
  );

  // SQL execution handler
  const handleExecuteSQL = useCallback(
    async (code: string) => {
      if (!code.trim() || isExecutingSql) {
        return;
      }

      if (selectedQuestionType && selectedQuestionType !== "sql") {
        setSqlError("SQL execution is only available for SQL questions.");
        return;
      }

      if (!isDuckDbReady) {
        setSqlError("SQL engine is still initializing. Please wait a moment and try again.");
        return;
      }

      if (isPreparingDuckDb) {
        setSqlError("Datasets are still loading. Please wait for the SQL engine to finish preparing.");
        return;
      }

      setIsExecutingSql(true);
      setSqlError("");
      setSqlResults([]);

      try {
        const result = await executeDuckDbQuery(code);
        if (!result.success) {
          throw new Error(result.error || "SQL execution failed");
        }

        const columns = result.result?.columns ?? [];
        const rows = result.result?.rows ?? [];

        if (columns.length === 0 && rows.length === 0) {
          setSqlResults([{ columns: [], values: [] }]);
        } else {
          setSqlResults([
            {
              columns,
              values: rows,
            },
          ]);
        }
        markQuestionCompleted(selectedQuestionForPopup);
      } catch (error) {
        console.error("SQL execution error:", error);
        setSqlError(error instanceof Error ? error.message : "An error occurred while executing SQL");
      } finally {
        setIsExecutingSql(false);
      }
    },
    [
      executeDuckDbQuery,
      isDuckDbReady,
      isExecutingSql,
      isPreparingDuckDb,
      markQuestionCompleted,
      selectedQuestionForPopup,
      selectedQuestionType,
    ],
  );

  const handleSelectExercise = useCallback(
    (sectionId: string, exercise: any) => {
      // console.log('[HANDLE SELECT EXERCISE DEBUG] Called with:', {
      //   sectionId,
      //   exerciseId: exercise?.id,
      //   exerciseTitle: exercise?.title,
      //   hasSection_exercise_questions: Array.isArray(exercise?.section_exercise_questions),
      //   section_exercise_questions_length: exercise?.section_exercise_questions?.length || 0,
      //   hasQuestions: Array.isArray(exercise?.questions),
      //   questions_length: exercise?.questions?.length || 0,
      //   exerciseKeys: exercise ? Object.keys(exercise) : []
      // });

      if (!exercise) return;

      // Ensure we exit practice mode so the embedded exercise view can render
      handleExitPractice();

      setSelectedSectionId(sectionId);
      setSelectedResource({
        sectionId,
        kind: "exercise",
        resourceId: exercise.id,
      });

      const questionList =
        (Array.isArray(exercise.section_exercise_questions) && exercise.section_exercise_questions.length > 0
          ? exercise.section_exercise_questions
          : exercise.questions) || [];

      // console.log('[HANDLE SELECT EXERCISE DEBUG] Question list:', {
      //   questionListLength: questionList.length,
      //   firstQuestion: questionList[0]
      //     ? {
      //         id: questionList[0].id,
      //         text: questionList[0].question_text || questionList[0].text,
      //         type: questionList[0].type || questionList[0].question_type,
      //       }
      //     : null,
      // });

      if (questionList.length > 0) {
        const firstQuestion = questionList[0];
        // console.log('[HANDLE SELECT EXERCISE DEBUG] Setting first question as selected');
        setActiveExerciseQuestion(
          {
            ...firstQuestion,
            exerciseId: exercise.id ? String(exercise.id) : null,
            exerciseTitle: exercise.title,
            exerciseDescription: exercise.description,
            exerciseDataset: normalizeCreationSql(exercise.dataset),
          },
          0,
          exercise,
        );
      } else {
        // console.log('[HANDLE SELECT EXERCISE DEBUG] No questions found, clearing selection');
        setSelectedQuestionForPopup(null);
      }

      setShowQuestionPopup(false);
    },
    [setActiveExerciseQuestion, handleExitPractice],
  );

  const handleNavigateExerciseQuestion = useCallback(
    (direction: 1 | -1) => {
      if (!activeExercise || !selectedQuestionForPopup || !activeExerciseQuestions.length) {
        return;
      }

      const currentIndex = activeExerciseQuestions.findIndex(
        (question: any) => String(question.id) === String(selectedQuestionForPopup.id),
      );

      if (currentIndex === -1) {
        return;
      }

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= activeExerciseQuestions.length) {
        return;
      }

      const targetQuestion = activeExerciseQuestions[targetIndex];
      if (!targetQuestion) {
        return;
      }

      setActiveExerciseQuestion(targetQuestion, targetIndex);
    },
    [activeExercise, activeExerciseQuestions, selectedQuestionForPopup, setActiveExerciseQuestion],
  );

  const handleSelectExerciseQuestionTab = useCallback(
    (targetIndex: number) => {
      if (!activeExerciseQuestions.length) {
        return;
      }
      const question = activeExerciseQuestions[targetIndex];
      if (!question) {
        return;
      }

      let currentActiveIndex = -1;
      if (selectedQuestionForPopup) {
        currentActiveIndex = activeExerciseQuestions.findIndex((candidate, candidateIndex) => {
          const candidateKey = getExerciseQuestionKey(candidate, candidateIndex);
          const selectedKey = getExerciseQuestionKey(selectedQuestionForPopup, candidateIndex);
          return candidateKey === selectedKey;
        });
      }

      if (currentActiveIndex === targetIndex) {
        return;
      }

      setActiveExerciseQuestion(question, targetIndex);
    },
    [activeExerciseQuestions, selectedQuestionForPopup, setActiveExerciseQuestion],
  );

  // Fetch exercise datasets when exercise is selected
  useEffect(() => {
    if (activeExercise?.id) {
      fetchExerciseDatasets(activeExercise.id);
    }
  }, [activeExercise?.id, fetchExerciseDatasets]);

  const exerciseDatasetList = useMemo(() => {
    if (!activeExercise?.id) {
      return [];
    }
    return exerciseDatasets[activeExercise.id] || [];
  }, [activeExercise?.id, exerciseDatasets]);

  const availableSqlDatasets = useMemo(() => {
    if (selectedQuestionType !== "sql") {
      return [];
    }

    type SqlDataset = {
      id: string;
      name: string;
      description?: string;
      placeholders?: string[];
      creation_sql?: string;
      table_name?: string;
      data?: any[];
      columns?: string[];
    };

    const datasets: SqlDataset[] = [];
    const seen = new Set<string>();

    const pushDataset = (dataset: SqlDataset) => {
      if (!dataset) return;
      const normalizedCreationSql = normalizeCreationSql(dataset.creation_sql);
      const normalizedDataset: SqlDataset = {
        ...dataset,
        creation_sql: normalizedCreationSql,
      };
      const key =
        normalizedCreationSql?.trim() ||
        (normalizedDataset.table_name
          ? `${normalizedDataset.table_name}:${Array.isArray(normalizedDataset.data) ? normalizedDataset.data.length : 0}`
          : normalizedDataset.id);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      datasets.push(normalizedDataset);
    };

    if (questionDataset) {
      pushDataset({
        id: `question-dataset:${questionDataset.id ?? "inline"}`,
        name: questionDataset.name || "Question Dataset",
        description: questionDataset.description || "Generated dataset for this question",
        placeholders: questionDataset.columns || questionDataset.placeholders,
        creation_sql:
          typeof questionDataset?.schema_info?.creation_sql === "string"
            ? questionDataset.schema_info.creation_sql
            : typeof questionDataset?.creation_sql === "string"
            ? questionDataset.creation_sql
            : undefined,
        table_name: questionDataset.table_name,
        data: questionDataset.data,
        columns: questionDataset.columns,
      });
    }

    const inlineQuestionDataset = (selectedQuestionForPopup as any)?.dataset;
    if (typeof inlineQuestionDataset === "string" && inlineQuestionDataset.trim()) {
      pushDataset({
        id: `question-inline:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: selectedQuestionForPopup?.exerciseTitle || "Question Dataset",
        description: "Dataset attached to question",
        creation_sql: inlineQuestionDataset,
      });
    } else if (inlineQuestionDataset && typeof inlineQuestionDataset === "object") {
      pushDataset({
        id: `question-inline:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: inlineQuestionDataset.name || selectedQuestionForPopup?.exerciseTitle || "Question Dataset",
        description: inlineQuestionDataset.description,
        creation_sql: inlineQuestionDataset.creation_sql ?? inlineQuestionDataset.sql,
        table_name: inlineQuestionDataset.table_name,
        data: inlineQuestionDataset.data,
        columns: inlineQuestionDataset.columns,
        placeholders: inlineQuestionDataset.placeholders,
      });
    }

    const questionExerciseDataset = (selectedQuestionForPopup as any)?.exerciseDataset;
    if (typeof questionExerciseDataset === "string" && questionExerciseDataset.trim()) {
      pushDataset({
        id: `question-exercise:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: selectedQuestionForPopup?.exerciseTitle || "Exercise Dataset",
        description: "Exercise-level dataset",
        creation_sql: questionExerciseDataset,
      });
    }

    if (currentExerciseData?.context?.data_creation_sql) {
      pushDataset({
        id: `exercise-context:${currentExerciseData.exercise?.id ?? "context"}`,
        name: currentExerciseData.exercise?.title || "Generated Dataset",
        description: currentExerciseData.context?.dataset_description,
        placeholders: Array.isArray(currentExerciseData.context?.expected_cols_list)
          ? currentExerciseData.context.expected_cols_list.flat()
          : undefined,
        creation_sql: currentExerciseData.context.data_creation_sql,
      });
    }

    if (activeExercise?.dataset && typeof activeExercise.dataset === "string") {
      pushDataset({
        id: `active-exercise-dataset:${activeExercise.id}`,
        name: activeExercise.title || "Exercise Dataset",
        description: "Dataset provided at exercise level",
        creation_sql: activeExercise.data,
      });
    }

    exerciseDatasetList.forEach((dataset: any, index: number) => {
      pushDataset({
        id: `exercise-${activeExercise?.id ?? "exercise"}-${dataset.id ?? index}`,
        name: dataset.name || `Dataset ${index + 1}`,
        description: dataset.description,
        placeholders: dataset.placeholders || dataset.columns,
        creation_sql:
          dataset.creation_sql ??
          dataset.sql ??
          dataset.data ??
          dataset.schema_info?.creation_sql,
        table_name: dataset.table_name,
        data: dataset.data,
        columns: dataset.columns,
      });
    });

    return datasets;
  }, [
    selectedQuestionType,
    questionDataset,
    selectedQuestionForPopup,
    currentExerciseData,
    activeExercise,
    exerciseDatasetList,
  ]);

  const datasetLoadSignature = useMemo(
    () =>
      JSON.stringify(
        availableSqlDatasets.map((dataset) => ({
          id: dataset.id,
          creation: dataset.creation_sql,
          table: dataset.table_name,
          rows: Array.isArray(dataset.data) ? dataset.data.length : 0,
        })),
      ),
    [availableSqlDatasets],
  );

  useEffect(() => {
    if (!selectedQuestionForPopup) {
      setSqlCode('');
      setSqlResults([]);
      setDuckDbTables([]);
      setDuckDbSetupError(null);
    }
  }, [selectedQuestionForPopup]);

  useEffect(() => {
    if (!selectedQuestionForPopup || selectedQuestionType !== "sql") {
      setDuckDbTables([]);
      setDuckDbSetupError(null);
      setIsPreparingDuckDb(false);
      return;
    }

    if (!isDuckDbReady) {
      return;
    }

    let cancelled = false;

    const splitSqlStatements = (sql: string) => {
      const statements: string[] = [];
      let current = "";
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inBacktick = false;

      for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const prevChar = sql[i - 1];

        if (char === "'" && prevChar !== "\\" && !inDoubleQuote && !inBacktick) {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && prevChar !== "\\" && !inSingleQuote && !inBacktick) {
          inDoubleQuote = !inDoubleQuote;
        } else if (char === "`" && prevChar !== "\\" && !inSingleQuote && !inDoubleQuote) {
          inBacktick = !inBacktick;
        }

        if (char === ";" && !inSingleQuote && !inDoubleQuote && !inBacktick) {
          if (current.trim().length > 0) {
            statements.push(current.trim());
          }
          current = "";
        } else {
          current += char;
        }
      }

      if (current.trim().length > 0) {
        statements.push(current.trim());
      }

      return statements;
    };

    const sanitizeSql = (sql: string) =>
      sql
        .replace(/--.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

    const escapeIdentifier = (value: string) => value.replace(/"/g, '""');

    const resetDatabase = async () => {
      const result = await executeDuckDbQuery("SHOW TABLES;");
      if (!result.success || !result.result) {
        return;
      }

      for (const row of result.result.rows) {
        const tableName = row?.[0];
        if (!tableName) continue;
        await executeDuckDbQuery(`DROP TABLE IF EXISTS "${escapeIdentifier(String(tableName))}"`);
      }
    };

    const prepareDatasets = async () => {
      // console.log("[DuckDB] Preparing datasets...", {
      //   questionId: selectedQuestionForPopup?.id,
      //   datasets: availableSqlDatasets.map((dataset) => ({
      //     id: dataset.id,
      //     hasCreationSql: Boolean(dataset.creation_sql),
      //     tableName: dataset.table_name,
      //   })),
      // });

      const executedStatements = new Set<string>();

      const executeSqlBlock = async (sql?: string) => {
        if (!sql) {
          return;
        }

        const sanitized = sanitizeSql(sql);
        for (const statement of splitSqlStatements(sanitized)) {
          const normalized = statement.replace(/\s+/g, " ").trim().toLowerCase();
          if (!normalized || executedStatements.has(normalized)) {
            continue;
          }

          const result = await executeDuckDbQuery(statement);
          if (!result.success) {
            throw new Error(result.error || "Failed to execute SQL statement");
          }

          executedStatements.add(normalized);
        }
      };

      setIsPreparingDuckDb(true);
      setDuckDbSetupError(null);
      setSqlResults([]);
      setSqlError('');

      try {
        await resetDatabase();

        for (const dataset of availableSqlDatasets) {
          if (cancelled) {
            return;
          }

          const creationSql = normalizeCreationSql(dataset.creation_sql);
          if (creationSql) {
            await executeSqlBlock(creationSql);
          } else if (
            dataset.table_name &&
            Array.isArray(dataset.data) &&
            dataset.data.length > 0
          ) {
            const loaded = await loadDuckDbDataset(dataset.table_name, dataset.data, dataset.columns);
            if (!loaded) {
              throw new Error(`Failed to load dataset ${dataset.table_name}`);
            }
          }
        }

        const tablesResult = await executeDuckDbQuery("SHOW TABLES;");
        if (!cancelled) {
          if (tablesResult.success && tablesResult.result) {
            const tables = tablesResult.result.rows
              .map((row) => row?.[0])
              .filter((value): value is string => Boolean(value));
            setDuckDbTables(tables);
          } else {
            setDuckDbTables([]);
          }
        }

        console.log("[DuckDB] Datasets ready.");
      } catch (error) {
        console.error("[DuckDB] Failed to prepare datasets:", error);
        if (!cancelled) {
          setDuckDbTables([]);
          setDuckDbSetupError(
            error instanceof Error ? error.message : "Failed to prepare SQL datasets",
          );
        }
      } finally {
        if (!cancelled) {
          setIsPreparingDuckDb(false);
        }
      }
    };

    prepareDatasets();

    return () => {
      cancelled = true;
    };
  }, [
    availableSqlDatasets,
    datasetLoadSignature,
    executeDuckDbQuery,
    loadDuckDbDataset,
    isDuckDbReady,
    selectedQuestionForPopup,
    selectedQuestionType,
  ]);

  useEffect(() => {
    // console.log('[AUTO-SELECT DEBUG] Effect triggered:', {
    //   resourceKind: selectedResource?.kind,
    //   activeExercise: activeExercise ? {
    //     id: activeExercise.id,
    //     title: activeExercise.title,
    //     hasQuestions: activeExercise.section_exercise_questions?.length || activeExercise.questions?.length || 0
    //   } : null,
    //   selectedQuestionForPopup: selectedQuestionForPopup?.id,
    // });

    if (selectedResource?.kind !== "exercise") {
      // console.log('[AUTO-SELECT DEBUG] Not exercise kind, returning');
      return;
    }

    if (!activeExercise) {
      // console.log('[AUTO-SELECT DEBUG] No active exercise, clearing selection');
      setSelectedQuestionForPopup(null);
      return;
    }

    const questions =
      (Array.isArray(activeExercise.section_exercise_questions) && activeExercise.section_exercise_questions.length > 0
        ? activeExercise.section_exercise_questions
        : activeExercise.questions) || [];

    // console.log('[AUTO-SELECT DEBUG] Questions found:', questions.length, questions);

    const currentExerciseId =
      selectedQuestionForPopup && "exerciseId" in selectedQuestionForPopup
        ? String((selectedQuestionForPopup as any).exerciseId)
        : null;
    const activeExerciseId = activeExercise?.id ? String(activeExercise.id) : null;

    if (!questions.length) {
      // console.log('[AUTO-SELECT DEBUG] No questions, clearing selection');
      if (currentExerciseId && activeExerciseId && currentExerciseId === activeExerciseId) {
        return;
      }
      setSelectedQuestionForPopup(null);
      return;
    }

    const currentQuestionId = selectedQuestionForPopup?.id;
    const hasCurrentSelection =
      currentQuestionId && currentExerciseId && activeExerciseId && currentExerciseId === activeExerciseId
        ? questions.some((q: any) => String(q.id) === String(currentQuestionId))
        : false;

    if (hasCurrentSelection) {
      // console.log('[AUTO-SELECT DEBUG] Has current selection, keeping it');
      return;
    }

    const firstQuestion = questions[0];
    // console.log('[AUTO-SELECT DEBUG] Setting first question:', firstQuestion);
    setActiveExerciseQuestion(
      {
        ...firstQuestion,
        exerciseId: activeExercise.id ? String(activeExercise.id) : null,
        exerciseTitle: activeExercise.title,
        exerciseDescription: activeExercise.description,
        exerciseDataset: normalizeCreationSql(activeExercise.dataset),
      },
      0,
    );
  }, [
    selectedResource?.kind,
    activeExercise,
    selectedQuestionForPopup,
    sectionExercises, // Add this dependency so useEffect runs when exercises are loaded
    activeExerciseQuestions,
    setActiveExerciseQuestion,
  ]);

  // Check if current lecture content is a video
  const isLectureVideo = useMemo(() => {
    if (!lectureContent) return false;

    const trimmed = lectureContent.trim();

    try {
      const url = new URL(trimmed);
      const lower = url.pathname.toLowerCase();

      return (
        url.hostname.includes("mediadelivery.net") ||
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".ogg")
      );
    } catch {
      return false;
    }
  }, [lectureContent]);

  // Scroll detection for floating video player
  useEffect(() => {
    if (!isLectureVideo || !lectureContent) {
      // console.log('Floating player: Not a video or no content', { isLectureVideo, lectureContent });
      return;
    }

    const checkFloatingPlayer = () => {
      if (!videoContainerRef.current) {
        // console.log('Floating player: No video container ref');
        return;
      }

      // Skip scroll detection when floating player is already shown to prevent flickering
      if (showFloatingPlayer) {
        // Only hide if main video gets focused (user clicked back to main area)
        if (isMainVideoFocused) {
          // console.log('Hiding floating player - main video focused');
          setShowFloatingPlayer(false);
          setIsFloatingPlayerManuallyClosed(false);
        }
        return;
      }

      const rect = videoContainerRef.current.getBoundingClientRect();
      const isVideoOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;

      // console.log('Floating player scroll check:', {
      //   isVideoOutOfView,
      //   isVideoFocused: isMainVideoFocused,
      //   rectBottom: rect.bottom,
      //   rectTop: rect.top,
      //   windowHeight: window.innerHeight,
      //   showFloatingPlayer
      // });

      // Show floating player when video goes out of view AND main video is not focused AND not manually closed
      if (isVideoOutOfView && !isMainVideoFocused && !isFloatingPlayerManuallyClosed) {
        // console.log('Showing floating player - video out of view and not focused');
        // No need to manage video state since it's the same video element
        setShowFloatingPlayer(true);
      }
    };

    const handleScroll = () => {
      if (scrollThrottleRef.current) return;
      
      scrollThrottleRef.current = setTimeout(() => {
        checkFloatingPlayer();
        scrollThrottleRef.current = null;
      }, 100);
    };

    // Initial check on mount
    checkFloatingPlayer();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkFloatingPlayer);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkFloatingPlayer);
    };

  }, [isLectureVideo, lectureContent, isMainVideoFocused, showFloatingPlayer, activeLecture?.title, selectedSection?.title]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (videoFocusTimeoutRef.current) {
        clearTimeout(videoFocusTimeoutRef.current);
      }
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
      }
      if (manualCloseTimeoutRef.current) {
        clearTimeout(manualCloseTimeoutRef.current);
      }
    };
  }, []);

  // Handle floating video player actions
  const handleCloseFloatingPlayer = useCallback(() => {
    setShowFloatingPlayer(false);
    setIsFloatingPlayerManuallyClosed(true);
    
    // No need to manage video state since it's the same video element
    
    // Clear any existing timeout
    if (manualCloseTimeoutRef.current) {
      clearTimeout(manualCloseTimeoutRef.current);
    }
    
    // Reset manual close flag after 3 seconds to allow automatic reopening
    manualCloseTimeoutRef.current = setTimeout(() => {
      setIsFloatingPlayerManuallyClosed(false);
    }, 3000);
  }, []);

  const handleExpandFloatingPlayer = useCallback(() => {
    setShowFloatingPlayer(false);
    setIsFloatingPlayerManuallyClosed(false); // Reset manual close flag since user is returning to main video
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // No need to manage video state since it's the same video element
    
    // Clear any existing manual close timeout
    if (manualCloseTimeoutRef.current) {
      clearTimeout(manualCloseTimeoutRef.current);
    }
  }, []);

  // Removed handleFloatingVideoTimeUpdate and handleFloatingVideoPlayStateChange 
  // since we're now using the same video element that pops out

  const activeQuiz = useMemo(() => {

    if (

      !selectedSection ||

      !selectedResource ||

      selectedResource.kind !== "quiz" ||

      selectedResource.sectionId !== selectedSection.id

    ) {

      return null;

    }

    // Use loaded quiz if available, otherwise fall back to section data
    if (loadedQuiz && loadedQuiz.id === selectedResource.resourceId) {
      return loadedQuiz;
    }

    const quizzes = getQuizzes(selectedSection);

    if (!quizzes.length) return null;

    if (!selectedResource.resourceId) return quizzes[0];

    return quizzes.find((quiz) => quiz.id === selectedResource.resourceId) || quizzes[0];

  }, [selectedResource, selectedSection, loadedQuiz]);

  const lectureNode = useMemo(() => {

    if (!lectureContent) {

      return (

        <div className="w-full h-full flex items-center justify-center text-sm text-white/70">

          Lecture content coming soon.

        </div>

      );

    }

    const txt = lectureContent.trim();

    try {

      const url = new URL(txt);

      const lower = url.pathname.toLowerCase();

      if (url.hostname.includes("mediadelivery.net")) {

        return (
          <VideoPlayer
            src={txt}
            className="h-full w-full object-cover"
            onTimeUpdate={updateCurrentTime}
            onPlayStateChange={updatePlayState}
            onDurationChange={updateDuration}
            onVideoRef={handleVideoRef}
            currentTime={videoState.currentTime}
            shouldPlay={videoState.isPlaying}
          />
        );

      }

      if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg")) {

        return (
          <VideoPlayer
            src={txt}
            className="h-full w-full object-cover"
            onTimeUpdate={updateCurrentTime}
            onPlayStateChange={updatePlayState}
            onDurationChange={updateDuration}
            onVideoRef={handleVideoRef}
            currentTime={videoState.currentTime}
            shouldPlay={videoState.isPlaying}
          />
        );

      }

      if (

        lower.endsWith(".png") ||

        lower.endsWith(".jpg") ||

        lower.endsWith(".jpeg") ||

        lower.endsWith(".gif") ||

        lower.endsWith(".webp")

      ) {

        return <img src={txt} alt="Learning Material" className="max-h-full object-contain rounded-lg" />;

      }

      if (lower.endsWith(".pdf")) {

        return <iframe src={txt} className="w-full h-full rounded-lg" />;

      }

      return (

        <a href={txt} target="_blank" className="text-xs underline text-blue-600 hover:text-blue-800">

          Open resource

        </a>

      );

    } catch {

      return (

        <div className="w-full h-full p-8 text-gray-800 overflow-auto bg-white rounded-lg">

          <div className="max-w-4xl mx-auto prose prose-lg">

            <div

              className="whitespace-pre-wrap leading-relaxed"

              dangerouslySetInnerHTML={{

                __html: txt

                  .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-4 mt-8">$1</h1>')

                  .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-gray-800 mb-3 mt-6">$1</h2>')

                  .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium text-gray-700 mb-2 mt-4">$1</h3>')

                  .replace(/^-\s+(.*$)/gm, '<li class="ml-4 list-disc">$1</li>')

                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')

                  .replace(

                    /\`\`\`sql([\s\S]*?)\`\`\`/g,

                    '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code class="language-sql">$1</code></pre>'

                  )

                  .replace(

                    /\`\`\`([\s\S]*?)\`\`\`/g,

                    '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>$1</code></pre>'

                  )

                  .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>')

              }}

            />

          </div>

        </div>

      );

    }

  }, [lectureContent]);

  const currentSectionIndex = Math.max(0, allSections.findIndex((section) => section.id === selectedSectionId));

  const currentResourceLabel = useMemo(() => {

    if (!selectedResource) return "Lesson Overview";

    if (selectedResource.kind === "lecture") {

      return activeLecture?.title || resourceLabels.lecture;

    }

    if (selectedResource.kind === "exercise") {

      return activeExercise?.title || resourceLabels.exercise;

    }

    if (selectedResource.kind === "quiz") {

      return activeQuiz?.title || resourceLabels.quiz;

    }

    return resourceLabels[selectedResource.kind];

  }, [selectedResource, activeLecture, activeExercise, activeQuiz]);

  const renderLectureDisplay = () => {

    if (!selectedSection || selectedResource?.kind !== "lecture" || !activeLecture) {

      return null;

    }

    const lectures = getLectures(selectedSection);

    const totalLecturesInSection = Math.max(lectures.length, 1);

    const lectureNumber = (lectureSelection?.index ?? 0) + 1;

    const canGoPrev = (lectureSelection?.index ?? 0) > 0 || currentSectionIndex > 0;

    const canGoNext =

      (lectureSelection?.index ?? 0) < totalLecturesInSection - 1 || currentSectionIndex < allSections.length - 1;

    const goToAdjacentLecture = (direction: -1 | 1) => {

      if (!lectureSelection || !selectedSection) return;

      const targetLectureIndex = lectureSelection.index + direction;

      if (targetLectureIndex >= 0 && targetLectureIndex < lectures.length) {

        const nextLecture = lectures[targetLectureIndex];

        const nextKey = getLectureKey(nextLecture, targetLectureIndex);

        setSelectedResource({

          sectionId: selectedSection.id,

          kind: "lecture",

          resourceId: nextKey,

        });

        return;

      }

      const targetSectionIndex = currentSectionIndex + direction;

      if (targetSectionIndex >= 0 && targetSectionIndex < allSections.length) {

        const targetSection = allSections[targetSectionIndex];

        setSelectedSectionId(targetSection.id);

        const fallback = getDefaultResource(targetSection as Section);

        setSelectedResource(fallback ?? null);

      }

    };

    const handlePrev = () => goToAdjacentLecture(-1);

    const handleNext = () => goToAdjacentLecture(1);

    const lectureMeta = `${lectureNumber} of ${totalLecturesInSection} in this section`;

    const lessonMeta = `Lesson ${currentSectionIndex + 1} of ${totalSections}`;

    const sectionSummary =

      typeof selectedSection.overview === "string" && selectedSection.overview.trim() !== ""

        ? selectedSection.overview.trim()

        : "Keep the momentum going and continue exploring the curriculum.";

    const sectionSummaryClean = sectionSummary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (isLectureVideo) {

      return (

        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">

          <div className="relative bg-slate-950 text-white">

            <div 
              ref={videoContainerRef} 
              className={`relative transition-all duration-300 ${
                showFloatingPlayer 
                  ? "fixed z-50 bg-black rounded-lg shadow-2xl border border-gray-700 overflow-hidden" 
                  : "aspect-video w-full"
              }`}
              style={showFloatingPlayer ? {
                width: '320px',
                height: '180px',
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: 9999
              } : {}}
              onMouseEnter={handleVideoContainerMouseEnter}
              onMouseLeave={handleVideoContainerMouseLeave}
              onClick={handleVideoContainerClick}
            >

              {/* Floating player header */}
              {showFloatingPlayer && (
                <div className="bg-gray-900 px-3 py-2 flex items-center justify-between cursor-move">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {activeLecture?.title || selectedSection?.title || "Video Player"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={handleExpandFloatingPlayer}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Expand to main view"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCloseFloatingPlayer}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Close floating player"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className={`${showFloatingPlayer ? 'h-full' : 'absolute inset-0'}`}>{lectureNode}</div>
              
              {/* Test button for floating player */}
              {/* <button
                onClick={() => {
                  console.log('Manual floating player trigger', { isLectureVideo, lectureContent, isPlaying: videoState.isPlaying });
                  setWasPlayingBeforeFloating(videoState.isPlaying);
                  setShowFloatingPlayer(true);
                  setFloatingVideoSrc(lectureContent);
                  setFloatingVideoTitle(activeLecture?.title || selectedSection?.title || "Video");
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs z-10 shadow-md"
              >
                test floating
              </button> */}

              {/* Video overlay info - only show when not floating */}
              {!showFloatingPlayer && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-6 py-4">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Now Playing</p>

                    <p className="mt-1 max-w-xl text-sm font-semibold leading-snug text-white/90">

                      {activeLecture.title || selectedSection.title || "Lesson"}

                    </p>

                  </div>

                <div className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur lg:flex">

                  <span>{lectureMeta}</span>

                  <span className="mx-2 text-white/40">|</span>

                  <span>{lessonMeta}</span>

                </div>

                </div>
              )}


            </div>

            {showFloatingPlayer && (
              <div className="aspect-video w-full bg-slate-800 flex items-center justify-center">
                <div className="text-center text-white/70">
                  <div className="mb-2">
                    <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Video playing in floating window</p>
                  <p className="text-xs mt-1 opacity-75">Click expand button to return here</p>
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6 border-t border-slate-100 bg-white px-6 py-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">

                  <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">

                    Section {currentSectionIndex + 1}

                  </span>

                  {lectures.length > 1 && (

                    <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">

                      Lecture {lectureNumber}

                    </span>

                  )}

                </div>

                <h2 className="mt-3 text-lg font-semibold text-slate-900">

                  {selectedSection.title}

                </h2>

                {/* <p className="mt-1 text-sm text-slate-600">

                  {sectionSummaryClean.length > 240 ? `${sectionSummaryClean.slice(0, 240)}...` : sectionSummaryClean}

                </p> */}

              </div>

              <div className="flex items-center gap-3">

                <button

                  type="button"

                  onClick={handlePrev}

                  disabled={!canGoPrev}

                  className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"

                >

                  <ChevronLeft className="h-4 w-4" />

                  <span>Previous</span>

                </button>

                <button

                  type="button"

                  onClick={handleNext}

                  disabled={!canGoNext}

                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-200"

                >

                  <span>Next</span>

                  <ChevronRight className="h-4 w-4" />

                </button>

              </div>

            </div>

          </div>

        </div>

      );

    }

    return (

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-100 via-white to-white px-6 py-4">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Learning Material</p>

          <h2 className="mt-2 text-lg font-semibold text-slate-900">{selectedSection.title}</h2>

          <p className="mt-1 text-sm text-slate-600">{lessonMeta}</p>

        </div>

        <div className="bg-slate-50 px-6 py-6">

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">

            {lectureNode}

          </div>

        </div>

      </div>

    );

  };

  const isGeneratedExerciseActive =
    !!(
      currentExerciseData?.exercise?.id &&
      selectedResource?.kind === "exercise" &&
      selectedResource?.resourceId === currentExerciseData.exercise.id &&
      selectedResource?.sectionId === selectedSectionId
    );

  // const renderExerciseDisplay = () => {
  //   // Deprecated: exercise content now rendered via renderQuestionPopup('embedded').
  // };

  const renderQuizDisplay = () => {

    if (selectedResource?.kind !== "quiz") {

      return null;

    }

    // Show loading state if generation is in progress
    if (isGeneratingContentForSection) {
      return (
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[460px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Generating quiz...</p>
          </div>
        </div>
      );
    }

    if (quizLoading) {

      return (

        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">

          <div className="text-center text-gray-500">Loading quiz...</div>

        </div>

      );

    }

    if (!activeQuiz) {

      return (

        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">

          <div className="text-center text-gray-500">No quiz available for this section.</div>

        </div>

      );

    }

    const questions = activeQuiz.quiz_questions || [];

    const totalQuestions = questions.length;

    const currentQuestion = questions[currentQuizQuestionIndex];

    if (questions.length === 0) {
      return (
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
          <div className="text-center text-gray-500">No questions available for this quiz.</div>
        </div>
      );
    }

    if (quizSubmitted) {
      return (
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quiz Completed!
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">
                You scored {quizScore} out of {totalQuestions} ({Math.round((quizScore / totalQuestions) * 100)}%)
              </p>
            </div>
          </div>
        </div>
      );
    }

  const handleNext = () => {
    if (currentQuizQuestionIndex < totalQuestions - 1) {
      setCurrentQuizQuestionIndex(currentQuizQuestionIndex + 1);
    } else {
      // Submit quiz
      let score = 0;
      questions.forEach((question, index) => {
        const userAnswer = quizAnswers[question.id || index.toString()];
        if (userAnswer && userAnswer.length > 0) {
          const correctOption = question.quiz_options?.find(opt => opt.correct);
          if (correctOption && userAnswer[0] === correctOption.text) {
            score++;
          }
        }
      });
      setQuizScore(score);
      setQuizSubmitted(true);

      // If in runner mode, handle completion
      if (isQuizRunnerMode && quizSession && selectedSection) {
        handleQuizComplete(selectedSection.id, score, quizAnswers);
      }
    }
  };

    const handlePrevious = () => {
      if (currentQuizQuestionIndex > 0) {
        setCurrentQuizQuestionIndex(currentQuizQuestionIndex - 1);
      }
    };

    const progressPct = totalQuestions > 0 ? ((currentQuizQuestionIndex + 1) / totalQuestions) * 100 : 0;

    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedSection?.title} - {activeQuiz.title || resourceLabels.quiz}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Question {currentQuizQuestionIndex + 1} of {totalQuestions}
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <p className="text-gray-700">{currentQuestion?.text || currentQuestion?.content}</p>
            </div>

            {currentQuestion?.type === 'text' && (
              <div className="space-y-3">
                <textarea
                  value={quizAnswers[currentQuestion.id || currentQuizQuestionIndex.toString()]?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuizAnswers(prev => ({
                      ...prev,
                      [currentQuestion.id || currentQuizQuestionIndex.toString()]: [value]
                    }));
                  }}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none min-h-[120px] text-gray-900"
                  rows={4}
                />
              </div>
            )}

            {currentQuestion?.quiz_options && currentQuestion.quiz_options.length > 0 && (
              <div className="space-y-3">
                {currentQuestion.quiz_options.map((option, optIndex) => {
                  const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
                  const isSelected = quizAnswers[currentQuestion.id || currentQuizQuestionIndex.toString()]?.includes(option.text || '') || false;
                  return (
                    <div
                      key={option.id || optIndex}
                      onClick={() => {
                        const optionText = option.text || '';
                        setQuizAnswers(prev => ({
                          ...prev,
                          [currentQuestion.id || currentQuizQuestionIndex.toString()]: [optionText]
                        }));
                      }}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        <strong>{optionLetter})</strong> {option.text || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentQuizQuestionIndex === 0}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {currentQuizQuestionIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );

  };

  const renderAdaptiveQuizDisplay = () => {
    // Show completion summary
    if (adaptiveQuizCompleted && adaptiveQuizSummary) {
      return (
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Adaptive Quiz Complete!</h2>
              <p className="text-sm text-gray-600 mt-1">Review your performance</p>
            </div>
            <button
              onClick={handleExitAdaptiveQuiz}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              Exit Quiz
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-indigo-600">{adaptiveQuizSummary.responses?.length || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {adaptiveQuizSummary.responses?.filter((r: any) => r.is_correct).length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(((adaptiveQuizSummary.responses?.filter((r: any) => r.is_correct).length || 0) /
                    (adaptiveQuizSummary.responses?.length || 1)) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Score</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Question Review</h3>
            {adaptiveQuizSummary.responses?.map((response: any, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${response.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Question {response.question_number}</span>
                    {response.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    response.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    response.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {response.difficulty || 'N/A'}
                  </span>
                </div>
                <p className="text-gray-800 mb-3">{response.question_text}</p>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">Your answer: <span className={response.is_correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{response.user_answer}</span></div>
                  {!response.is_correct && (
                    <div className="text-gray-600">Correct answer: <span className="text-green-700 font-medium">{response.correct_answer}</span></div>
                  )}
                </div>
                {response.explanation && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-700">{response.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Show current question
    if (currentAdaptiveQuestion) {
      const options = currentAdaptiveQuestion.options || [];
      // console.log(currentAdaptiveQuestion);

      return (
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Adaptive Quiz</h2>
              <p className="text-sm text-gray-600 mt-1">
                Question {currentAdaptiveQuestion.question_number}
                {adaptiveQuizSession?.target_length && ` of ~${adaptiveQuizSession.target_length}`}
              </p>
            </div>
            <button
              onClick={handleExitAdaptiveQuiz}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Exit
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{currentAdaptiveQuestion.question_text}</h3>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                currentAdaptiveQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentAdaptiveQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentAdaptiveQuestion.difficulty || 'N/A'}
              </span>
            </div>

          <div className="space-y-3">
              {options.map((option: any, index: number) => {
                const optionLabel = option.label || String.fromCharCode(65 + index); // A, B, C, D...
                const optionText = option.text || option.option_text || option;
                const isSelected = adaptiveQuizAnswer === optionLabel;

                return (
                  <button
                    key={optionLabel}
                    onClick={() => setAdaptiveQuizAnswer(optionLabel)}
                    disabled={submittingAdaptiveAnswer || showAdaptiveExplanation}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-gray-900">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {showAdaptiveExplanation && lastAnswerCorrect !== null && (
            <div className={`mb-6 p-4 rounded-lg border ${
              lastAnswerCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {lastAnswerCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-semibold ${lastAnswerCorrect ? 'text-green-900' : 'text-red-900'}`}>
                  {lastAnswerCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              {currentAdaptiveQuestion.explanation && (
                <p className="text-sm text-gray-700">{currentAdaptiveQuestion.explanation}</p>
              )}
              {!lastAnswerCorrect && currentAdaptiveQuestion.correct_answer && (
                <p className="text-sm text-gray-700 mt-2">
                  Correct answer: <span className="font-medium">{currentAdaptiveQuestion.correct_answer}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleAdaptiveQuizSubmit}
              disabled={!adaptiveQuizAnswer || submittingAdaptiveAnswer || showAdaptiveExplanation}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submittingAdaptiveAnswer ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
            <button
              onClick={handleAdaptiveQuizNext}
              disabled={
                submittingAdaptiveAnswer ||
                !showAdaptiveExplanation ||
                !pendingAdaptiveQuestion
              }
              className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
            </button>
          </div>
        </div>
      );
    }

    // Loading state
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Starting adaptive quiz...</p>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyDisplay = () => (

    <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[320px]">

      <div className="h-full w-full flex items-center justify-center p-12 text-sm text-gray-500">

        Select a lecture, exercise, or quiz from the sidebar to get started.

      </div>

    </div>

  );

  const renderQuestionPopup = (variant: "modal" | "embedded" = "modal") => {
    const isEmbedded = variant === "embedded";

    if (!selectedQuestionForPopup) {
      if (isEmbedded) {
        return (
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg min-h-[320px] flex items-center justify-center">
            <p className="text-sm text-gray-500">Select an exercise question to get started.</p>
          </div>
        );
      }
      return null;
    }

    if (!isEmbedded && !showQuestionPopup) {
      return null;
    }

    const question = selectedQuestionForPopup;
    const questionType = (question.question_type || question.type || "sql").toLowerCase();
    const questionList = activeExerciseQuestions;
    const currentQuestionIndex = questionList.findIndex(
      (item: any) => String(item.id) === String(question.id),
    );
    const hasNextQuestion =
      currentQuestionIndex >= 0 && currentQuestionIndex < questionList.length - 1;
    const questionDifficulty =
      (question as any).difficulty ||
      (question as any).content?.difficulty ||
      (question as any).question_difficulty ||
      "";
    const questionHint =
      question.hint ||
      (question as any).adaptive_note ||
      (question as any).content?.hint ||
      "";

    const languageConfig: Record<string, { name: string; starterCode: string }> = {
      sql: {
        name: "SQL",
        starterCode: `-- Write your SQL query here\n-- ${question.text || question.question_text}\n\n-- Example solution:\n-- SELECT * FROM table_name;\n\n`,
      },
      python: {
        name: "Python",
        starterCode: `# Write your Python code here\n# ${question.text || question.question_text}\n\ndef solution():\n    # Your code here\n    pass\n\nsolution()\n`,
      },
      google_sheets: {
        name: "Google Sheets Formula",
        starterCode: `=${question.text || question.question_text}\n\n`,
      },
      statistics: {
        name: "Statistics",
        starterCode: `# Statistical analysis solution\n# ${question.text || question.question_text}\n\n`,
      },
      reasoning: {
        name: "Reasoning",
        starterCode: `# Logical reasoning solution\n# ${question.text || question.question_text}\n\n`,
      },
      math: {
        name: "Mathematics",
        starterCode: `# Mathematical solution\n# ${question.text || question.question_text}\n\n`,
      },
      geometry: {
        name: "Geometry",
        starterCode: `# Geometric solution\n# ${question.text || question.question_text}\n\n`,
      },
    };

    const config = languageConfig[questionType] || languageConfig.sql;

    const availableDatasets = questionType === "sql" ? availableSqlDatasets : [];

    const headerTitle =
      question.exerciseTitle || activeExercise?.title || selectedSection?.title || "Exercise";
    const headerSubtitle =
      question.exerciseDescription || activeExercise?.description || selectedSection?.overview || "";
    const trimmedSubtitle =
      typeof headerSubtitle === "string" && headerSubtitle.length > 160
        ? `${headerSubtitle.slice(0, 157)}...`
        : headerSubtitle;

    const containerClass = isEmbedded
      ? "flex flex-col rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[520px]"
      : "bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col";

    const header = (
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            {isEmbedded ? "Practice Exercise" : "Practice Question"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 truncate">{headerTitle}</h2>
          {trimmedSubtitle && (
            <p className="mt-1 text-sm text-gray-600">{trimmedSubtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              questionType === "sql"
                ? "bg-blue-100 text-blue-800"
                : questionType === "python"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {config.name}
          </span>
          {!isEmbedded && (
            <button
              onClick={() => {
                setShowQuestionPopup(false);
                setSelectedQuestionForPopup(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>
    );

    const questionTabsBar =
      questionList.length > 0 ? (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {questionList.map((questionItem: any, index: number) => {
              const key = getExerciseQuestionKey(questionItem, index);
              const status = questionCompletionStatus[key] === "completed";
              const isActive = index === currentQuestionIndex;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectExerciseQuestionTab(index)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {status ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-gray-300" />
                  )}
                  <span>Question {index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null;

    const content = (
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col min-h-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Question</h3>
              {questionDifficulty && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    questionDifficulty === "Beginner"
                      ? "bg-green-100 text-green-700"
                      : questionDifficulty === "Intermediate"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {questionDifficulty}
                </span>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed">{question.text || question.question_text}</p>
            {questionHint && (
              <p className="mt-3 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                Hint: {questionHint}
              </p>
            )}
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              {config.name} Editor
            </div>
            <textarea
              value={sqlCode}
              onChange={(e) => setSqlCode(e.target.value)}
              className={`flex-1 font-mono text-sm p-4 outline-none resize-none border-x ${
                questionType === "sql"
                  ? "bg-[#0f172a] text-green-400"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
              placeholder={config.starterCode}
              spellCheck={false}
            />
            <div className="border-t border-gray-200 p-3 flex gap-2 justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                {isExecutingSql && (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExecuteSQL(sqlCode)}
                  disabled={
                    isExecutingSql ||
                    !sqlCode.trim() ||
                    !isDuckDbReady ||
                    isPreparingDuckDb
                  }
                  className="rounded-md border border-blue-500 bg-blue-600 text-white px-4 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run Code
                </button>
                <button
                  onClick={() => markQuestionCompleted(question)}
                  className="rounded-md bg-indigo-600 border border-indigo-600 px-4 py-1.5 text-xs text-white hover:bg-indigo-700"
                >
                  Submit Solution
                </button>
                <button
                  onClick={() => handleNavigateExerciseQuestion(1)}
                  disabled={!hasNextQuestion || isPreparingDuckDb || isDuckDbLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Question
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col min-h-0 border-l border-gray-200">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              Output
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-900 text-green-400 font-mono text-sm">
              {duckDbError && (
                <div className="text-red-300 bg-red-900/40 border border-red-800 px-3 py-2 rounded mb-3">
                  {duckDbError}
                </div>
              )}
              {duckDbSetupError && (
                <div className="text-red-300 bg-red-900/30 border border-red-800 px-3 py-2 rounded mb-3">
                  {duckDbSetupError}
                </div>
              )}
              {(isDuckDbLoading || isPreparingDuckDb) && (
                <div className="flex items-center gap-2 text-xs text-blue-200 mb-3">
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                  <span>{isDuckDbLoading ? "Initializing SQL engine..." : "Loading datasets into DuckDB..."}</span>
                </div>
              )}
              {!isDuckDbLoading && !isPreparingDuckDb && duckDbTables.length > 0 && (
                <div className="text-xs text-green-300 mb-3">
                  Tables ready:{" "}
                  {duckDbTables.slice(0, 5).join(", ")}
                  {duckDbTables.length > 5 ? `, +${duckDbTables.length - 5} more` : ""}
                </div>
              )}
              {sqlError && (
                <div className="text-red-400 bg-red-900/20 p-3 rounded-lg mb-4">{sqlError}</div>
              )}
              {sqlResults.map((result, index) => (
                <div key={index} className="mb-6">
                  {result.columns.length > 0 && result.values.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-green-500">
                            {result.columns.map((col: string) => (
                              <th key={col} className="px-2 py-1 text-left text-green-200 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.values.slice(0, 10).map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-b border-green-800">
                              {row.map((cell: any, cellIndex: number) => (
                                <td key={cellIndex} className="px-2 py-1 text-green-300">
                                  {cell ?? "NULL"}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {result.values.length > 10 && (
                            <tr>
                              <td
                                colSpan={result.columns.length}
                                className="px-2 py-1 text-center text-green-500 text-xs italic"
                              >
                                ... {result.values.length - 10} more rows ...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {result.columns.length === 0 && result.values.length === 0 && (
                    <div className="text-green-400 text-sm">Query executed successfully (no results to display)</div>
                  )}
                </div>
              ))}
              {sqlResults.length === 0 && !sqlError && sqlCode.trim() && (
                <div className="text-gray-400 italic">Run your code to see results here...</div>
              )}
            </div>
          </div>
          {questionType === "sql" && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                Available Datasets
              </div>
              <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                {(isDuckDbLoading || isPreparingDuckDb) && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span>{isDuckDbLoading ? "Initializing DuckDB..." : "Preparing datasets..."}</span>
                  </div>
                )}
                {!isDuckDbLoading && !isPreparingDuckDb && duckDbTables.length > 0 && (
                  <div className="text-xs text-green-600">
                    Tables ready in DuckDB: {duckDbTables.slice(0, 5).join(", ")}
                    {duckDbTables.length > 5 ? `, +${duckDbTables.length - 5} more` : ""}
                  </div>
                )}
                {availableDatasets.length > 0 ? (
                  availableDatasets.map((dataset: any) => (
                    <div key={dataset.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          {dataset.name}
                        </h4>
                        {dataset.description && (
                          <p className="text-xs text-gray-600 mt-1">{dataset.description}</p>
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="text-xs text-gray-600">
                          💡 Available columns:{" "}
                          {Array.isArray(dataset.placeholders) && dataset.placeholders.length
                            ? dataset.placeholders.slice(0, 5).join(", ")
                            : dataset.table_name || "No columns specified"}
                        </div>
                        {dataset.creation_sql && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">Dataset Creation SQL:</div>
                            <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                              {dataset.creation_sql}
                            </div>
                            <button
                              onClick={() => setSqlCode(dataset.creation_sql)}
                              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            >
                              Load Dataset SQL
                            </button>
                          </div>
                        )}
                        {loadingDataset && (
                          <div className="text-xs text-blue-600">Loading dataset information...</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No dataset information available.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    const container = (
      <div className={containerClass}>
        {header}
        {questionTabsBar}
        {content}
      </div>
    );

    if (isEmbedded) {
      return container;
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {container}
      </div>
    );
  };


  let contentDisplay;

  // Show loader when generating content
  if (selectedSectionId && (generatingExercise[selectedSectionId] || generatingQuiz[selectedSectionId])) {
    const isGeneratingQuiz = generatingQuiz[selectedSectionId] && !generatingExercise[selectedSectionId];
    contentDisplay = (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[460px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{isGeneratingQuiz ? "Starting adaptive quiz..." : "Generating exercise..."}</p>
        </div>
      </div>
    );
  } else if (isAdaptiveQuizMode) {
    contentDisplay = renderAdaptiveQuizDisplay();
  } else if (isPracticeMode) {
    const exerciseType = getExerciseTypeBySubject(subjectTitle) as 'sql' | 'python' | 'google_sheets' | 'statistics' | 'reasoning' | 'math' | 'geometry';
    contentDisplay = (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Practice Mode: {selectedPracticeExercise?.title || 'Exercise'}
          </h2>
          <button
            onClick={handleExitPractice}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Exit Practice
          </button>
        </div>
        <PracticeArea
          questions={practiceQuestions}
          datasets={practiceDatasets}
          exerciseType={exerciseType}
          exerciseTitle={selectedPracticeExercise?.title}
          onSubmit={handlePracticeSubmit}
        />
      </div>
    );
  } else if (selectedResource?.kind === "lecture") {
    contentDisplay = renderLectureDisplay();
  } else if (selectedResource?.kind === "exercise") {
    contentDisplay = renderQuestionPopup("embedded");
  } else if (selectedResource?.kind === "quiz") {
    contentDisplay = renderQuizDisplay();
  } else {
    contentDisplay = renderEmptyDisplay();
  }

  const activePracticeTitle = isPracticeMode && selectedPracticeExercise
    ? selectedPracticeExercise.title
    : isGeneratedExerciseActive
      ? currentExerciseData?.exercise?.title || null
      : null;

  return (

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 h-full">

      <div ref={mainContentRef} className="space-y-6">

        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">

          <div className="flex items-start justify-between mb-4">

            <div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">

                {trackTitle}

                {subjectTitle ? ` / ${subjectTitle}` : ""}

              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600">

                <div className="flex items-center gap-2">

                  <BookOpen className="h-4 w-4" />

                  <span>

                    {totalSections} lesson{totalSections === 1 ? "" : "s"}

                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <Clock className="h-4 w-4" />

                  <span>~{Math.max(1, Math.ceil(totalSections * 15))} minutes</span>

                </div>

              </div>

            </div>

            <div className="text-right">

              <div className="text-sm text-gray-600 mb-1">Progress</div>

              <div className="text-2xl font-bold text-indigo-600">

                {completedSections}/{totalSections}

              </div>

              <div className="text-xs text-gray-500">lessons completed</div>

            </div>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">

            <div

              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"

              style={{ width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%` }}

            />

          </div>

          <div className="mt-2 text-xs text-gray-600 text-center">

            {Math.round(totalSections > 0 ? (completedSections / totalSections) * 100 : 0)}% Complete

          </div>

        </div>

        {/* {selectedSection && (

          <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 backdrop-blur-xl">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="p-2 bg-indigo-100 rounded-lg">

                  <Play className="h-5 w-5 text-indigo-600" />

                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">Current Activity</h3>

                  <p className="text-sm text-gray-600">

                    {selectedSection.title}

                    {currentResourceLabel ? ` - ${currentResourceLabel}` : ""}

                  </p>

                </div>

              </div>

              <div className="text-sm text-gray-500">

                Lesson {currentSectionIndex + 1} of {totalSections}

              </div>

            </div>

          </div>

        )} */}

        {contentDisplay}

        <ProfessionalCourseTabs

          courseHrefBase={`/curriculum/${courseId}/${subjectId}`}

          sectionId={selectedSectionId}

          sectionTitle={selectedSection?.title}

          section={selectedSection}

          courseId={courseId}

          subjectId={subjectId}

          trackTitle={trackTitle}

          subjectTitle={subjectTitle || undefined}

        />

      </div>

      <div className="space-y-6 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin] lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-slate-300/60 lg:hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/70 lg:[&::-webkit-scrollbar-track]:bg-transparent">
        {activePracticeTitle ? (
          <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-4 backdrop-blur-xl shadow-lg">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Practice Exercise</div>
            <p className="mt-3 text-xl font-semibold text-gray-900">{activePracticeTitle}</p>
          </div>
        ) : (
          <>

        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-4 backdrop-blur-xl shadow-lg">

          <div className="flex items-center gap-2 mb-3">

            <BookOpen className="h-5 w-5 text-indigo-500" />

            <h2 className="font-semibold text-gray-900">Course Content</h2>

          </div>

          <p className="text-sm text-gray-600">Drill into a section to pick the resource you want to study.</p>

        </div>

        <div className="space-y-4">

          {(subjectModules || []).map((module, moduleIndex) => (

            <div

              key={module.slug || `module-${moduleIndex}`}

              className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg overflow-hidden"

            >

              <div className="p-4 border-b border-gray-200/50">

                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">

                    {moduleIndex + 1}

                  </div>

                  {module.title}

                </h3>

                <p className="text-sm text-gray-600 mt-1">

                  {(module.sections || []).length} lesson{(module.sections || []).length === 1 ? "" : "s"}

                </p>

              </div>

              <div className="p-2">

                {(module.sections || []).map((section, moduleSectionIndex) => {

                  const globalSectionIndex = allSections.findIndex((candidate) => candidate.id === section.id);

                  const isCurrentSection = section.id === selectedSectionId;

                    const isCompleted = globalSectionIndex >= 0 ? currentSectionIndex > globalSectionIndex : false;

                  const lectures = getLectures(section);
                  
                  const exercises = getExercises(section);

                    const quizzes = getQuizzes(section);

                    const isExpanded = isCurrentSection;

                    const matchesLecture =

                      selectedResource?.sectionId === section.id && selectedResource.kind === "lecture";

                    const defaultLectureKey = lectures.length ? getLectureKey(lectures[0], 0) : null;

                    const activeLectureKey = matchesLecture

                      ? selectedResource.resourceId ?? defaultLectureKey

                      : null;

                    const shouldHideGenerationButtons = moduleIndex === 0 && moduleSectionIndex === 0;
                    // const shouldHideGenerationButtons = exercises.length > 0;

                    return (

                    <div key={section.id} className="mb-2 last:mb-0">

                      <button

                        ref={registerSectionRef(section.id)}

                        onClick={() => {

                          autoScrollArmedRef.current = true;

                          setSelectedSectionId((prev) => (prev === section.id ? prev : section.id));

                          setSelectedResource((prev) => {

                            if (prev && prev.sectionId === section.id) {

                              return prev;

                            }

                            return getDefaultResource(section) ?? null;

                          });

                        }}

                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${

                          isCurrentSection ? "bg-indigo-100 border border-indigo-200" : "hover:bg-gray-50"

                        }`}

                      >

                        <div className="flex-shrink-0">

                          {isCompleted ? (

                            <CheckCircle className="h-5 w-5 text-green-500" />

                          ) : isCurrentSection ? (

                            <Play className="h-5 w-5 text-indigo-500" />

                          ) : (

                            <Circle className="h-5 w-5 text-gray-400" />

                          )}

                        </div>

                        <div className="flex-1 min-w-0">

                          <div

                            className={`text-sm font-medium truncate ${

                              isCurrentSection ? "text-indigo-900" : "text-gray-900"

                            }`}

                          >

                            {section.title}

                          </div>

                          <div className="text-xs text-gray-500 mt-1">

                            {isCompleted ? "Completed" : isCurrentSection ? "Current" : "Not started"}

                          </div>

                        </div>

                        <ChevronRight

                          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${

                            isExpanded ? "rotate-90 text-indigo-500" : ""

                          }`}

                        />

                      </button>



                      {isExpanded && (

                        <div className="mt-2 space-y-1 pl-11 pr-2 pb-3">

                          {lectures.map((lecture, lectureIndex) => {

                            const lectureKey = getLectureKey(lecture, lectureIndex);

                            const isActiveLecture = matchesLecture && activeLectureKey === lectureKey;

                            return (

                              <button

                                key={lectureKey}

                                onClick={() => {

                                  setSelectedSectionId(section.id);

                                  setSelectedResource({

                                    sectionId: section.id,

                                    kind: "lecture",

                                    resourceId: lectureKey,

                                  });

                                }}

                               className={`w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${

                                  isActiveLecture ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50"

                                }`}

                              >

                                <Play className="h-4 w-4" />

                                <span>{lecture.title || `Lecture ${lectureIndex + 1}`}</span>

                              </button>

                            );

                          })}

                          {(() => {
                            // Use sectionExercises from API if available, otherwise fallback to section.exercises
                            const sectionExercisesData = sectionExercises[section.id];
                            const hasExercisesFromAPI = sectionExercisesData && sectionExercisesData.length > 0;

                            if (hasExercisesFromAPI) {
                              return sectionExercisesData.map((exercise: any) => (
                                <div key={exercise.id} className="space-y-2">
                                  {/* Exercise Header with Instructions */}
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 text-sm">{exercise.title}</h4>
                                    {exercise.description && (
                                      <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                                    )}
                                    {/* Dataset Preview */}
                                    {exercise.dataset && (
                                      <div className="mt-2 p-2 bg-white rounded border text-xs">
                                        <p className="font-medium text-gray-800 mb-1">Dataset:</p>
                                        {typeof exercise.dataset === 'string' ? (
                                          <pre className="text-gray-700 overflow-auto max-h-20">{exercise.dataset}</pre>
                                        ) : (
                                          <div className="overflow-auto max-h-20">
                                            {Object.keys(exercise.dataset || {}).slice(0, 3).map(key => (
                                              <div key={key} className="text-gray-700">
                                                {key}: {JSON.stringify((exercise.dataset as any)[key]).slice(0, 50)}...
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Questions for this exercise */}
                                  {exercise?.section_exercise_questions && exercise.section_exercise_questions.length > 0 && (
                                    <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                                      {exercise.section_exercise_questions.map((question: any, questionIndex: number) => {
                                        const isActiveQuestion = selectedResource?.sectionId === section.id &&
                                          selectedResource?.kind === "exercise" &&
                                          selectedResource?.resourceId === exercise.id &&
                                          selectedQuestionForPopup?.id === question.id;

                                        return (
                                          <button
                                            key={`${exercise.id}-question-${question.id || questionIndex}`}
                                            onClick={() => {
                                              handleSelectExercise(section.id, exercise);
                                              setActiveExerciseQuestion(
                                                {
                                                  ...question,
                                                  exerciseTitle: exercise.title,
                                                  exerciseDescription: exercise.description,
                                                  exerciseDataset: normalizeCreationSql(exercise.dataset),
                                                },
                                                questionIndex,
                                              );
                                              setShowQuestionPopup(true);
                                            }}
                                            className={`w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
                                              isActiveQuestion ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                          >
                                            <Code className="h-4 w-4" />
                                            <span className="text-left truncate">{question.question_text || question.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ));
                            } else if (exercises.length > 0) {

                              // Fallback to generic exercises
                              console.log("Using generic exercises:", exercises);

                              return exercises.map((exercise, exerciseIndex) => (
                                <div key={exercise.id || exerciseIndex} className="space-y-2">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 text-sm">{exercise.title}</h4>
                                    {exercise.description && (
                                      <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleSelectExercise(section.id, exercise)}
                                    className="w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition text-gray-600 hover:bg-gray-50"
                                  >
                                    <Code className="h-4 w-4" />
                                    <span>Open Exercise</span>
                                  </button>
                                </div>
                              ));
                            }

                            return null;
                          })()}

                          {!shouldHideGenerationButtons && (
                            <>
                              {/* Generate Exercise Button */}
                              <button
                                onClick={() => handleGenerateExercise(section)}
                                disabled={generatingExercise[section.id]}
                                className="w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                              >
                                {generatingExercise[section.id] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Code className="h-4 w-4" />
                                    <span>Generate Practice Exercise</span>
                                  </>
                                )}
                              </button>

                              {/* Adaptive Quiz Button */}
                              <button
                                onClick={() => handleStartAdaptiveQuiz(section)}
                                disabled={generatingQuiz[section.id] || isAdaptiveQuizMode}
                                className="w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                              >
                                {generatingQuiz[section.id] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Starting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Activity className="h-4 w-4" />
                                    <span>Start Adaptive Quiz</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}

                        </div>

                      )}

                    </div>

                  );

                })}

              </div>

            </div>

          ))}

          </div>

          </>
        )}

      </div>

    </div>

    );
}
