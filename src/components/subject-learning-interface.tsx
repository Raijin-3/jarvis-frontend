"use client";
import { apiGet, apiPost } from "@/lib/api-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { VideoPlayer } from "@/components/video-player";
import { ProfessionalCourseTabs } from "@/components/professional-course-tabs";
import { PracticeArea } from "@/components/practice-area";
import { useVideoState } from "@/hooks/use-video-state";
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useDuckDB } from "@/hooks/use-duckdb";
import { usePyodide } from "@/hooks/use-pyodide";

import {
  Activity,
  BookOpen,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  Circle,
  Clock,
  Code,
  FileText,
  Download,
  Play,
} from "lucide-react";

// HTML Sanitization for adaptive quiz questions
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'sup', 'sub', 'pre', 'code', 'br', 'p', 'table', 'tr', 'td', 'th'],
  ALLOWED_ATTR: [],
};

const sanitizeQuestionHTML = (html: string): string => {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};
 

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

interface QuestionDatasetSchemaInfo extends Record<string, unknown> {
  creation_sql?: string;
  create_sql?: string;
  creation_python?: string;
  create_python?: string;
  dataset_rows?: Array<Record<string, unknown>>;
  dataset_columns?: string[];
  dataset_table_name?: string;
  dataset_csv_raw?: string;
  table_name?: string;
}

interface QuestionDatasetRecord extends Record<string, unknown> {
  id?: string;
  name?: string;
  description?: string;
  creation_sql?: string;
  create_sql?: string;
  creation_python?: string;
  create_python?: string;
  dataset?: unknown;
  table_name?: string;
  columns?: string[];
  data?: Array<Record<string, unknown>>;
  schema_info?: QuestionDatasetSchemaInfo;
  dataset_csv_raw?: string;
  placeholders?: string[];
}

type DatasetPreview = {
  columns: string[];
  rows: unknown[][];
};

type SpreadsheetDatasetDefinition = {
  id: string;
  name: string;
  description?: string;
  preview: DatasetPreview | null;
  tableNames: string[];
  originalName?: string;
};

const DATASET_TIMESTAMP_COLUMNS = new Set(["InteractionDate", "ResolutionDate"]);

type SqlDatasetDefinition = {
  id: string;
  name: string;
  description?: string;
  placeholders?: string[];
  creation_sql?: string;
  create_sql?: string;
  table_name?: string;
  data?: any[];
  columns?: string[];
  cacheKey?: string;
  creationTables?: string[];
};

type SqlDatasetVariant = SqlDatasetDefinition & {
  baseDatasetId: string;
  displayName: string;
  resolvedTableName?: string;
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
    data_creation_python?: string;
    create_python?: string;
    creation_python?: string;
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

type AdaptiveQuizSectionStatus = {
  hasActiveQuiz: boolean;
  sessionId?: string;
};

const resourceLabels: Record<ResourceKind, string> = {
  lecture: "Lecture Video",
  exercise: "Practice Exercise",
  quiz: "Section Quiz",
};

type GenerateSectionExercisesPayload = {
  sectionId: string;
  courseId: string;
  subjectId: string;
  sectionTitle: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  exerciseType?: "sql" | "python" | "google_sheets" | "statistics" | "reasoning" | "math" | "geometry";
  questionCount?: number;
  userId?: string;
};

type GenerateSectionQuizPayload = {
  sectionId: string;
  courseId: string;
  subjectId: string;
  sectionTitle: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  questionCount?: number;
  questionTypes?: string[];
  prevQuizResult?: {
    score: number;
    answers: Record<string, any>;
    feedback?: string;
    stop?: boolean;
  };
};

type AdaptiveQuizStartPayload = {
  courseId: string;
  subjectId: string;
  sectionId: string;
  sectionTitle: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  targetLength?: number;
};

type AdaptiveQuizResumePayload = {
  sectionId?: string;
};

type AdaptiveQuizNextQuestionPayload = {
  sessionId: string;
  previousAnswer?: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
  };
};

const getQuizAction = (quizId: string) => apiGet<Quiz>(`v1/quizzes/${quizId}`);

const generateSectionExercisesAction = (payload: GenerateSectionExercisesPayload) =>
  apiPost<GeneratedExerciseResponse>(`/v1/sections/${payload.sectionId}/generate-exercises`, {
    courseId: payload.courseId,
    subjectId: payload.subjectId,
    sectionTitle: payload.sectionTitle,
    difficulty: payload.difficulty,
    exerciseType: payload.exerciseType,
    questionCount: payload.questionCount,
    userId: payload.userId,
  });

const generateSectionQuizAction = (payload: GenerateSectionQuizPayload) =>
  apiPost(`/v1/sections/${payload.sectionId}/generate-quiz`, {
    courseId: payload.courseId,
    subjectId: payload.subjectId,
    sectionTitle: payload.sectionTitle,
    difficulty: payload.difficulty,
    questionCount: payload.questionCount,
    questionTypes: payload.questionTypes,
    ...(payload.prevQuizResult ? { prevQuizResult: payload.prevQuizResult } : {}),
  });

const getSectionExercisesAction = (sectionId: string) =>
  apiGet(`/v1/sections/${sectionId}/exercises`);

const getSectionQuizzesAction = (sectionId: string) =>
  apiGet(`/v1/sections/${sectionId}/quizzes`);

const getExerciseDatasetsAction = (exerciseId: string) =>
  apiGet(`/v1/practice-exercises/${exerciseId}/datasets`);

const startAdaptiveQuizAction = (payload: AdaptiveQuizStartPayload) =>
  apiPost(`/v1/adaptive-quiz/start`, payload);

const resumeAdaptiveQuizAction = (payload: AdaptiveQuizResumePayload = {}) =>
  apiPost(`/v1/adaptive-quiz/resume`, payload);

const checkAdaptiveQuizStatusAction = (sectionId: string) =>
  apiPost(`/v1/adaptive-quiz/check-status`, { sectionId });

const getNextQuestionAction = (payload: AdaptiveQuizNextQuestionPayload) =>
  apiPost(`/v1/adaptive-quiz/next-question`, payload);

const getAdaptiveQuizSummaryAction = (sessionId: string) =>
  apiPost(`/v1/adaptive-quiz/summary`, { sessionId });

const getExerciseProgressAction = (exerciseId: string) =>
  apiGet(`/v1/sections/exercises/${exerciseId}/progress`);

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

type NormalizeCreationSqlOptions = {
  datasetType?: string | null;
  preserveFormatting?: boolean;
};

const resolveDatasetLanguage = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed.toLowerCase();
      }
    }
  }
  return undefined;
};

const coalesceString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const stripCodeFence = (value: string, { trimResult = true }: { trimResult?: boolean } = {}) => {
  const fullFenceMatch = value.match(/^```[\w+-]*\n([\s\S]*?)\n```$/i);
  if (fullFenceMatch) {
    const inner = fullFenceMatch[1];
    return trimResult ? inner.trim() : inner;
  }

  let stripped = value;
  stripped = stripped.replace(/^```[\w+-]*\s*\r?\n?/, "");
  stripped = stripped.replace(/\r?\n?```[\w+-]*\s*$/, "");
  return trimResult ? stripped.trim() : stripped;
};

const normalizeCreationSql = (
  value?: string | null,
  options: NormalizeCreationSqlOptions = {},
): string | undefined => {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  const datasetType = resolveDatasetLanguage(options.datasetType);
  const preserveFormatting = options.preserveFormatting ?? datasetType === "python";

  let normalized = value.replace(/\r\n/g, "\n");
  if (!preserveFormatting) {
    normalized = normalized.trim();
    if (!normalized) {
      return undefined;
    }

    normalized = stripCodeFence(normalized, { trimResult: true });

    normalized = normalized.replace(/\s*```[\w+-]*\s*$/gi, "").trim();
    normalized = normalized.replace(/\s+```[\w+-]*\s*/gi, " ").trim();

    return normalized || undefined;
  }

  normalized = stripCodeFence(normalized, { trimResult: false });

  // Preserve formatting but remove non-printable BOM if present
  if (normalized.charCodeAt(0) === 0xfeff) {
    normalized = normalized.slice(1);
  }

  return normalized || undefined;
};

const normalizeQuestionDataset = (
  rawDataset: unknown,
  context?: { questionId?: string; questionTitle?: string; subjectType?: string | null }
): QuestionDatasetRecord | null => {
  if (!rawDataset) {
    return null;
  }

  const contextSubjectType = resolveDatasetLanguage(context?.subjectType);

  if (typeof rawDataset === "string") {
    const creationSql = normalizeCreationSql(rawDataset, {
      datasetType: contextSubjectType,
    });
    if (!creationSql) {
      return null;
    }

    const datasetCsv = extractCsvFromSource(creationSql);

    return {
      id: context?.questionId,
      name: context?.questionTitle ?? "Question Dataset",
      creation_sql: creationSql,
      dataset_csv_raw: datasetCsv,
      subject_type: contextSubjectType,
    };
  }

  if (typeof rawDataset !== "object" || Array.isArray(rawDataset)) {
    return null;
  }

  const base = rawDataset as Record<string, unknown>;
  const schemaInfoRaw = base.schema_info;
  const datasetSubjectType = resolveDatasetLanguage(
    base.subject_type,
    base.type,
    base.question_type,
    contextSubjectType,
  );

  const schemaInfo =
    schemaInfoRaw && typeof schemaInfoRaw === "object" && !Array.isArray(schemaInfoRaw)
      ? (() => {
          const schemaCreationSqlRaw = coalesceString(
            (schemaInfoRaw as QuestionDatasetSchemaInfo).create_sql,
            (schemaInfoRaw as QuestionDatasetSchemaInfo).creation_sql,
            (schemaInfoRaw as Record<string, unknown>)?.data_creation_sql,
          );
          const normalizedSchemaCreationSql = normalizeCreationSql(schemaCreationSqlRaw, {
            datasetType: datasetSubjectType,
          });
          const existingSchemaCsv = (schemaInfoRaw as QuestionDatasetSchemaInfo).dataset_csv_raw;
          const normalizedSchemaCsv =
            typeof existingSchemaCsv === "string" && existingSchemaCsv.trim().length > 0
              ? extractCsvFromSource(existingSchemaCsv) ?? existingSchemaCsv
              : extractCsvFromSource(normalizedSchemaCreationSql);
          const schemaCreationPythonRaw = coalesceString(
            (schemaInfoRaw as QuestionDatasetSchemaInfo).create_python,
            (schemaInfoRaw as QuestionDatasetSchemaInfo).creation_python,
            (schemaInfoRaw as Record<string, unknown>)?.data_creation_python,
          );

          return {
            ...(schemaInfoRaw as QuestionDatasetSchemaInfo),
            creation_sql: normalizedSchemaCreationSql,
            create_sql: normalizedSchemaCreationSql ?? undefined,
            creation_python: schemaCreationPythonRaw ?? undefined,
            create_python: schemaCreationPythonRaw ?? undefined,
            dataset_csv_raw: normalizedSchemaCsv,
          };
        })()
      : undefined;

  const schemaRows =
    schemaInfo && Array.isArray(schemaInfo.dataset_rows) && schemaInfo.dataset_rows.length > 0
      ? schemaInfo.dataset_rows
      : undefined;

  const schemaColumns =
    schemaInfo && Array.isArray(schemaInfo.dataset_columns) && schemaInfo.dataset_columns.length > 0
      ? schemaInfo.dataset_columns
      : undefined;

  const baseCreationSqlRaw = coalesceString(
    base.create_sql,
    base.creation_sql,
    base.sql,
    base.dataset,
    schemaInfo?.create_sql,
    schemaInfo?.creation_sql,
    (base as Record<string, unknown>)["data_creation_sql"],
  );
  const normalizedCreationSql = normalizeCreationSql(baseCreationSqlRaw, {
    datasetType: datasetSubjectType,
  });
  const baseCreationPythonRaw = coalesceString(
    base.create_python,
    base.creation_python,
    schemaInfo?.create_python,
    schemaInfo?.creation_python,
    (base as Record<string, unknown>)["data_creation_python"],
  );

  let datasetCsvRaw: string | undefined;
  if (typeof base.dataset_csv_raw === "string" && base.dataset_csv_raw.trim().length > 0) {
    datasetCsvRaw = extractCsvFromSource(base.dataset_csv_raw) ?? base.dataset_csv_raw;
  } else if (
    typeof schemaInfo?.dataset_csv_raw === "string" &&
    schemaInfo.dataset_csv_raw.trim().length > 0
  ) {
    datasetCsvRaw = extractCsvFromSource(schemaInfo.dataset_csv_raw) ?? schemaInfo.dataset_csv_raw;
  } else {
    datasetCsvRaw = extractCsvFromSource(normalizedCreationSql);
  }

  const parsedCsvRows = datasetCsvRaw ? parseCsvToObjects(datasetCsvRaw) : [];

  let dataArray =
    Array.isArray(base.data) && base.data.length > 0
      ? (base.data as Array<Record<string, unknown>>)
      : schemaRows;

  if ((!dataArray || dataArray.length === 0) && parsedCsvRows.length > 0) {
    dataArray = parsedCsvRows;
  }

  let columnsArray =
    Array.isArray(base.columns) && base.columns.length > 0
      ? (base.columns as string[])
      : schemaColumns ?? (dataArray && dataArray.length > 0 ? Object.keys(dataArray[0]) : undefined);

  if ((!columnsArray || columnsArray.length === 0) && parsedCsvRows.length > 0) {
    columnsArray = Object.keys(parsedCsvRows[0]);
  }

  const tableName =
    (base.table_name as string | undefined) ??
    schemaInfo?.table_name ??
    schemaInfo?.dataset_table_name;

  return {
    ...base,
    id: (base.id as string | undefined) ?? context?.questionId,
    name:
      (base.name as string | undefined) ?? context?.questionTitle ?? "Question Dataset",
    description: (base.description as string | undefined) ?? undefined,
    creation_sql: normalizedCreationSql,
    create_sql: normalizedCreationSql ?? undefined,
    creation_python: baseCreationPythonRaw ?? undefined,
    create_python: baseCreationPythonRaw ?? undefined,
    table_name: tableName,
    columns: columnsArray,
    data: dataArray,
    schema_info: schemaInfo,
    dataset_csv_raw: datasetCsvRaw,
    placeholders: Array.isArray(base.placeholders) ? (base.placeholders as string[]) : undefined,
    subject_type:
      datasetSubjectType ??                             
      (typeof base.subject_type === "string" ? base.subject_type : undefined),
  };
};

const deriveExerciseDatasets = (
  exercise: any,
  options: { datasetType?: string } = {},
): QuestionDatasetRecord[] => {
  if (!exercise) {
    return [];
  }

  const exerciseId =
    typeof exercise?.id === "string"
      ? exercise.id
      : typeof exercise?.id === "number"
      ? String(exercise.id)
      : undefined;

  const datasetType = resolveDatasetLanguage(
    options.datasetType,
    exercise?.subject_type,
    exercise?.exercise_type,
    exercise?.practice_type,
    exercise?.type,
  );

  const datasets: QuestionDatasetRecord[] = [];

  const contextCandidate =
    exercise?.context && typeof exercise.context === "object"
      ? normalizeQuestionDataset(
          {
            ...exercise.context,
            id:
              (exercise.context as Record<string, unknown>)?.id ??
              (exercise.context as Record<string, unknown>)?.dataset_id ??
              exerciseId,
            name: resolveDatasetLabel(
              coalesceString(
                (exercise.context as Record<string, unknown>)?.dataset_name as string | undefined,
                exercise?.dataset_name,
              ),
              exercise?.title ?? "Exercise Dataset",
            ),
            description: coalesceString(
              (exercise.context as Record<string, unknown>)?.dataset_description as string | undefined,
              exercise?.dataset_description,
            ),
            dataset: coalesceString(
              (exercise.context as Record<string, unknown>)?.dataset as string | undefined,
              (exercise.context as Record<string, unknown>)?.data_creation_sql as string | undefined,
              exercise?.dataset,
              exercise?.data,
            ),
            create_sql: coalesceString(
              (exercise.context as Record<string, unknown>)?.create_sql as string | undefined,
              (exercise.context as Record<string, unknown>)?.data_creation_sql as string | undefined,
              exercise?.dataset,
            ),
            creation_sql: coalesceString(
              (exercise.context as Record<string, unknown>)?.creation_sql as string | undefined,
              (exercise.context as Record<string, unknown>)?.data_creation_sql as string | undefined,
              exercise?.dataset,
            ),
            dataset_csv_raw: coalesceString(
              (exercise.context as Record<string, unknown>)?.dataset_csv_raw as string | undefined,
              exercise?.dataset_csv_raw,
            ),
          },
          {
            questionId: exerciseId,
            questionTitle: exercise?.title,
            subjectType: datasetType,
          },
        )
      : null;

  if (
    contextCandidate &&
    (contextCandidate.creation_sql || contextCandidate.dataset_csv_raw || contextCandidate.data)
  ) {
    datasets.push({
      ...contextCandidate,
      id: contextCandidate.id ?? exerciseId,
      name:
        contextCandidate.name ??
        resolveDatasetLabel(
          coalesceString(
            (exercise.context as Record<string, unknown>)?.dataset_name as string | undefined,
            exercise?.dataset_name,
          ),
          exercise?.title ?? "Exercise Dataset",
        ),
    });
  }

  if (!datasets.length) {
    const directCandidate = normalizeQuestionDataset(
      {
        id: exerciseId,
        name: resolveDatasetLabel(
          coalesceString(exercise?.dataset_name, exercise?.title),
          exercise?.title ?? "Exercise Dataset",
        ),
        description: coalesceString(exercise?.dataset_description, exercise?.description),
        dataset: coalesceString(exercise?.dataset, exercise?.data),
        dataset_csv_raw: exercise?.dataset_csv_raw,
        columns: Array.isArray(exercise?.dataset_columns) ? exercise.dataset_columns : undefined,
        data: Array.isArray(exercise?.dataset_rows) ? exercise.dataset_rows : undefined,
        subject_type: datasetType,
      },
      {
        questionId: exerciseId,
        questionTitle: exercise?.title,
        subjectType: datasetType,
      },
    );

    if (
      directCandidate &&
      (directCandidate.creation_sql || directCandidate.dataset_csv_raw || directCandidate.data)
    ) {
      datasets.push({
        ...directCandidate,
        id: directCandidate.id ?? exerciseId,
      });
    }
  }

  return datasets.map((dataset) => {
    const rows =
      Array.isArray(dataset.data) && dataset.data.length > 0
        ? (dataset.data as Array<Record<string, unknown>>)
        : dataset.dataset_csv_raw
        ? parseCsvToObjects(dataset.dataset_csv_raw)
        : [];
    const columns =
      Array.isArray(dataset.columns) && dataset.columns.length > 0
        ? (dataset.columns as string[])
        : rows.length > 0
        ? Object.keys(rows[0])
        : (dataset.columns as string[] | undefined);

    return {
      ...dataset,
      data: rows,
      data_preview: rows,
      columns,
      data_dictionary:
        (dataset as Record<string, unknown>).data_dictionary ??
        (exercise?.context as Record<string, unknown>)?.data_dictionary ??
        (exercise as Record<string, unknown>)?.data_dictionary,
    };
  });
};

type PythonDatasetDefinition = {
  id: string;
  name: string;
  description?: string;
  data?: unknown[];
  columns?: string[];
  dataset_csv_raw?: string;
  schema_info?: QuestionDatasetSchemaInfo;
  table_name?: string;
  source?: string;
  creation_sql?: string;
  create_sql?: string;
  creation_python?: string;
  create_python?: string;
};

type PythonDatasetDetail = {
  id: string;
  name: string;
  displayName: string;
  originalName?: string;
  description?: string;
  columns: string[];
  objectRows: Record<string, unknown>[];
  previewRows: unknown[][];
  pythonVariable: string;
  rowCount: number;
  datasetCsv?: string;
  loadError?: string;
  tableNames: string[];
  creation_python?: string;
};

type PythonDatasetLoadState = {
  state: "idle" | "loading" | "loaded" | "failed";
  message?: string;
  variable?: string;
};

const sanitizePythonIdentifier = (value?: string | null, fallback = "dataset") => {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  const normalized = value
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (!normalized) {
    return fallback;
  }
  return /^[a-z_]/.test(normalized) ? normalized : `data_${normalized}`;
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values.map((value) => value.replace(/^"(.*)"$/, "$1"));
};

const extractCsvFromSource = (source?: string | null): string | undefined => {
  if (!source || typeof source !== "string") {
    return undefined;
  }

  const normalized = source.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const commentPattern = /^\s*(\/\/|--|#)/;
  const headerSqlPattern =
    /\b(select|create|insert|update|delete|merge|with|drop|alter|table|into|values)\b/i;

  const csvLines: string[] = [];
  let headerDetected = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!headerDetected) {
      if (!trimmed) {
        continue;
      }
      if (commentPattern.test(trimmed)) {
        continue;
      }
      if (headerSqlPattern.test(trimmed)) {
        return undefined;
      }

      const cells = splitCsvLine(rawLine);
      if (cells.length <= 1) {
        continue;
      }

      csvLines.push(rawLine.replace(/\s+$/, ""));
      headerDetected = true;
    } else {
      if (!trimmed) {
        continue;
      }
      if (commentPattern.test(trimmed)) {
        continue;
      }
      csvLines.push(rawLine.replace(/\s+$/, ""));
    }
  }

  if (!headerDetected || csvLines.length < 2) {
    return undefined;
  }

  return csvLines.join("\n");
};

const parseCsvToObjects = (csv?: string | null): Record<string, unknown>[] => {
  const sanitized = extractCsvFromSource(csv);
  if (!sanitized) return [];

  const lines = sanitized.split("\n");
  const meaningfulLines = lines.filter((line) => line.trim().length > 0);
  if (meaningfulLines.length < 2) return [];

  const closingTriplePattern = /^['"]{3}\s*;?$/;

  const headers = splitCsvLine(meaningfulLines[0]).map((header, idx) => {
    let cleaned = header.trim();

    if (idx === 0) {
      const assignmentMatch = cleaned.match(
        /^[A-Za-z_][\w]*\s*=\s*(?:[frbuFRBU]{0,3})?\s*(?:['"]{3}|['"])?\s*(.*)$/
      );
      if (assignmentMatch && assignmentMatch[1]) {
        cleaned = assignmentMatch[1].trim();
      }
      cleaned = cleaned.replace(/['"]{3}\s*$/g, "").replace(/['"]\s*$/g, "").trim();
    }

    if (!cleaned) {
      cleaned = `column_${idx + 1}`;
    }

    return cleaned;
  });

  const rows: Record<string, unknown>[] = [];

  for (const rawLine of meaningfulLines.slice(1)) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine || closingTriplePattern.test(trimmedLine)) {
      continue;
    }

    const cells = splitCsvLine(rawLine);
    if (cells.length === 1 && closingTriplePattern.test(cells[0].trim())) {
      continue;
    }

    const entry: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      if (!header) {
        return;
      }
      entry[header] = cells[idx] ?? "";
    });

    rows.push(entry);
  }

  return rows;
};

const buildDatasetPreviewFromRecord = (dataset: any): DatasetPreview | null => {
  if (!dataset) {
    return null;
  }

  let workingDataset = dataset;

  if (typeof workingDataset === "string") {
    const csvContent = extractCsvFromSource(workingDataset);
    if (!csvContent) {
      return null;
    }
    const parsed = parseCsvToObjects(csvContent);
    if (!parsed.length) {
      return null;
    }
    workingDataset = {
      data: parsed,
      columns: Object.keys(parsed[0]),
      dataset_csv_raw: csvContent,
    };
  }

  const schemaInfo =
    workingDataset && typeof workingDataset === "object" && !Array.isArray(workingDataset)
      ? (workingDataset as { schema_info?: QuestionDatasetSchemaInfo }).schema_info
      : undefined;

  let csvRaw: string | undefined;

  const inlineCsv =
    typeof (workingDataset as { dataset_csv_raw?: unknown })?.dataset_csv_raw === "string"
      ? (workingDataset as { dataset_csv_raw?: string }).dataset_csv_raw
      : undefined;
  const schemaCsv =
    typeof schemaInfo?.dataset_csv_raw === "string"
      ? schemaInfo.dataset_csv_raw
      : undefined;

  if (inlineCsv && inlineCsv.trim().length > 0) {
    csvRaw = extractCsvFromSource(inlineCsv) ?? inlineCsv;
  } else if (schemaCsv && schemaCsv.trim().length > 0) {
    csvRaw = extractCsvFromSource(schemaCsv) ?? schemaCsv;
  }

  if (!csvRaw) {
    const creationCandidate = coalesceString(
      (workingDataset as { creation_sql?: string })?.creation_sql,
      (workingDataset as { create_sql?: string })?.create_sql,
      schemaInfo?.creation_sql,
      schemaInfo?.create_sql,
    );
    csvRaw = extractCsvFromSource(creationCandidate);
  }

  let rows: any[] = Array.isArray((workingDataset as { data?: unknown[] })?.data)
    ? ((workingDataset as { data?: unknown[] }).data as any[])
    : [];

  if ((!rows || rows.length === 0) && Array.isArray(schemaInfo?.dataset_rows)) {
    rows = schemaInfo.dataset_rows;
  }

  if ((!rows || rows.length === 0) && csvRaw) {
    const parsedRows = parseCsvToObjects(csvRaw);
    if (parsedRows.length) {
      rows = parsedRows;
    }
  }

  if (!rows || rows.length === 0) {
    return null;
  }

  let columns: string[] = Array.isArray((workingDataset as { columns?: unknown[] })?.columns)
    ? ((workingDataset as { columns?: unknown[] }).columns as unknown[])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  if ((!columns || columns.length === 0) && Array.isArray(schemaInfo?.dataset_columns)) {
    columns = schemaInfo.dataset_columns.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  const firstRow = rows[0];

  if (!columns || columns.length === 0) {
    if (firstRow && typeof firstRow === "object" && !Array.isArray(firstRow)) {
      columns = Object.keys(firstRow as Record<string, unknown>);
    } else if (Array.isArray(firstRow)) {
      const maxLength = rows.reduce(
        (max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max),
        0,
      );
      columns = Array.from({ length: maxLength }, (_, index) => `column_${index + 1}`);
    } else {
      columns = ["value"];
    }
  } else if (Array.isArray(firstRow) && columns.length < firstRow.length) {
    const maxLength = rows.reduce(
      (max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max),
      columns.length,
    );
    const nextColumns = columns.slice();
    for (let idx = nextColumns.length; idx < maxLength; idx++) {
      nextColumns.push(`column_${idx + 1}`);
    }
    columns = nextColumns;
  }

  if (!columns || columns.length === 0) {
    return null;
  }

  const previewRows = rows.map((row) => {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const typedRow = row as Record<string, unknown>;
      return columns.map((column) => (column in typedRow ? typedRow[column] ?? null : null));
    }
    if (Array.isArray(row)) {
      return columns.map((_, index) => row[index] ?? null);
    }
    return columns.map(() => row ?? null);
  });

  return {
    columns,
    rows: previewRows,
  };
};

const buildPythonDatasetDetail = (
  dataset: PythonDatasetDefinition,
  index: number,
): PythonDatasetDetail => {
  const schemaInfo = dataset.schema_info;

  let csvRaw: string | undefined;

  if (typeof dataset.dataset_csv_raw === "string" && dataset.dataset_csv_raw.trim().length > 0) {
    csvRaw = extractCsvFromSource(dataset.dataset_csv_raw) ?? dataset.dataset_csv_raw;
  } else if (
    typeof schemaInfo?.dataset_csv_raw === "string" &&
    schemaInfo.dataset_csv_raw.trim().length > 0
  ) {
    csvRaw = extractCsvFromSource(schemaInfo.dataset_csv_raw) ?? schemaInfo.dataset_csv_raw;
  }

  let rawRows: unknown[] = [];
  if (Array.isArray(dataset.data) && dataset.data.length > 0) {
    rawRows = dataset.data;
  } else if (
    schemaInfo &&
    Array.isArray(schemaInfo.dataset_rows) &&
    schemaInfo.dataset_rows.length > 0
  ) {
    rawRows = schemaInfo.dataset_rows;
  } else if (csvRaw) {
    rawRows = parseCsvToObjects(csvRaw);
  }

  let columns =
    Array.isArray(dataset.columns) && dataset.columns.length > 0
      ? dataset.columns.filter((value): value is string => typeof value === "string")
      : [];

  if (
    columns.length === 0 &&
    schemaInfo &&
    Array.isArray(schemaInfo.dataset_columns) &&
    schemaInfo.dataset_columns.length > 0
  ) {
    columns = schemaInfo.dataset_columns.filter(
      (value): value is string => typeof value === "string",
    );
  }

  let objectRows: Record<string, unknown>[] = [];

  if (rawRows.length > 0) {
    const sample = rawRows[0];
    if (sample && typeof sample === "object" && !Array.isArray(sample)) {
      const typedRows = rawRows as Record<string, unknown>[];
      const columnSet = new Set(columns);
      typedRows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (!columnSet.has(key)) {
            columnSet.add(key);
          }
        });
      });
      columns = Array.from(columnSet);
      objectRows = typedRows.map((row) => {
        const normalized: Record<string, unknown> = {};
        columns.forEach((column) => {
          normalized[column] = column in row ? row[column] : null;
        });
        return normalized;
      });
    } else if (Array.isArray(sample)) {
      const arrayRows = rawRows as unknown[][];
      const maxLength = arrayRows.reduce(
        (max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max),
        columns.length,
      );
      for (let idx = 0; idx < maxLength; idx++) {
        if (!columns[idx]) {
          columns[idx] = `column_${idx + 1}`;
        }
      }
      objectRows = arrayRows.map((row) => {
        const normalized: Record<string, unknown> = {};
        columns.forEach((column, idx) => {
          normalized[column] = Array.isArray(row) ? row[idx] ?? null : null;
        });
        return normalized;
      });
    } else {
      const fallbackColumn = columns[0] || "value";
      if (!columns.length) {
        columns = [fallbackColumn];
      }
      objectRows = rawRows.map((value) => ({ [fallbackColumn]: value }));
    }
  }

  const previewRows = objectRows.slice(0, 20).map((row) => columns.map((column) => row[column] ?? null));

  const creationSqlMeta = coalesceString(
    dataset.creation_sql,
    dataset.create_sql,
    schemaInfo?.creation_sql,
    schemaInfo?.create_sql,
    (schemaInfo as Record<string, unknown> | undefined)?.data_creation_sql,
  );

  const datasetDescriptionMeta =
    (typeof dataset.description === "string" && dataset.description.trim().length > 0
      ? dataset.description
      : undefined) ??
    (typeof (schemaInfo as Record<string, unknown> | undefined)?.dataset_description === "string"
      ? String((schemaInfo as Record<string, unknown>).dataset_description)
      : undefined);

  const rawTableNames = extractDatasetTableNames(dataset, {
    creationSql: creationSqlMeta ?? null,
    description: datasetDescriptionMeta ?? null,
  });
  const tableNames: string[] = [];
  const seenTableNames = new Set<string>();
  rawTableNames.forEach((tableName) => {
    const resolved = resolveDatasetLabel(tableName);
    const key = normalizeDatasetLabel(resolved);
    if (key && !seenTableNames.has(key)) {
      seenTableNames.add(key);
      tableNames.push(resolved);
    }
  });

  const primaryTableName =
    tableNames.length > 0
      ? tableNames[0]
      : dataset.table_name ||
        schemaInfo?.dataset_table_name ||
        schemaInfo?.table_name ||
        undefined;

  const pythonVariable = sanitizePythonIdentifier(
    primaryTableName || dataset.table_name || dataset.name || `dataset_${index + 1}`,
  );

  const originalName =
    dataset.name ||
    schemaInfo?.dataset_table_name ||
    dataset.table_name ||
    `Dataset ${index + 1}`;

  const displayName = primaryTableName || pythonVariable || originalName;

  // Generate basic Python setup code for loading the dataset
  const creation_python = `import pandas as pd

# Dataset is loaded as: ${pythonVariable}`;

  return {
    id: dataset.id,
    name: primaryTableName || originalName,
    displayName,
    originalName,
    description: dataset.description,
    columns,
    objectRows,
    previewRows,
    pythonVariable,
    rowCount: objectRows.length,
    datasetCsv: csvRaw,
    tableNames,
    creation_python,
    loadError:
      objectRows.length === 0
        ? csvRaw
          ? "Dataset CSV could not be parsed."
          : "No structured rows available for this dataset."
        : undefined,
  };
};

const extractTableNamesFromSql = (value?: string | null): string[] => {
  const normalized = normalizeCreationSql(value);
  if (!normalized) {
    return [];
  }

  const sanitize = (sql: string) =>
    sql
      .replace(/--.*$/gm, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ");

  const statements = sanitize(normalized)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  const detectedTables = new Set<string>();

  for (const statement of statements) {
    const patterns = [
      /create\s+(?:or\s+replace\s+)?table\s+(?:if\s+not\s+exists\s+)?(?:(["`])([^"`]+)\1|\[([^\]]+)\]|([a-zA-Z0-9_.]+))/gi,
      /create\s+(?:or\s+replace\s+)?view\s+(?:if\s+not\s+exists\s+)?(?:(["`])([^"`]+)\1|\[([^\]]+)\]|([a-zA-Z0-9_.]+))/gi,
      /insert\s+into\s+(?:(["`])([^"`]+)\1|\[([^\]]+)\]|([a-zA-Z0-9_.]+))/gi,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(statement)) !== null) {
        const tableName = (match[2] ?? match[3] ?? match[4])?.trim();
        if (tableName) {
          detectedTables.add(tableName);
        }
      }
    }
  }

  return Array.from(detectedTables);
};

const extractTableNameFromDescription = (description?: string | null): string | null => {
  if (typeof description !== "string") {
    return null;
  }

  const trimmed = description.trim();
  if (!trimmed) {
    return null;
  }

  const parenMatch = trimmed.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (parenMatch) {
    return parenMatch[1];
  }

  const tableMatch = trimmed.match(/\btable\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if (tableMatch) {
    return tableMatch[1];
  }

  return null;
};

const extractDatasetTableNames = (
  dataset: unknown,
  meta?: { description?: string | null; creationSql?: string | null },
): string[] => {
  const normalizedNames = new Map<string, string>();
  const addName = (value?: unknown) => {
    if (typeof value !== "string") {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (/^(dataset|table)$/i.test(trimmed)) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (!normalizedNames.has(key)) {
      normalizedNames.set(key, trimmed);
    }
  };

  const datasetRecord =
    dataset && typeof dataset === "object" && !Array.isArray(dataset)
      ? (dataset as Record<string, unknown>)
      : null;

  const schemaInfo =
    datasetRecord && typeof datasetRecord["schema_info"] === "object"
      ? (datasetRecord["schema_info"] as QuestionDatasetSchemaInfo)
      : null;

  if (datasetRecord) {
    addName(datasetRecord["table_name"]);
    addName(datasetRecord["dataset_table_name"]);
    addName((datasetRecord["tableName"] as string) ?? undefined);

    const datasetTables = datasetRecord["tables"];
    if (Array.isArray(datasetTables)) {
      datasetTables.forEach(addName);
    }

    const datasetTableNames = datasetRecord["table_names"];
    if (Array.isArray(datasetTableNames)) {
      datasetTableNames.forEach(addName);
    }

    const datasetDatasetTables = datasetRecord["dataset_tables"];
    if (Array.isArray(datasetDatasetTables)) {
      datasetDatasetTables.forEach(addName);
    }
  }

  if (schemaInfo) {
    addName(schemaInfo.table_name as string | undefined);
    addName(schemaInfo.dataset_table_name);

    const schemaTables = (schemaInfo as Record<string, unknown>)?.tables;
    if (Array.isArray(schemaTables)) {
      (schemaTables as unknown[]).forEach(addName);
    }

    const schemaDatasetTables = (schemaInfo as Record<string, unknown>)?.dataset_tables;
    if (Array.isArray(schemaDatasetTables)) {
      (schemaDatasetTables as unknown[]).forEach(addName);
    }
  }

  const collectCreationSql = (value?: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      extractTableNamesFromSql(value).forEach(addName);
    }
  };

  if (datasetRecord) {
    collectCreationSql(datasetRecord["creation_sql"]);
    collectCreationSql(datasetRecord["create_sql"]);
    collectCreationSql(datasetRecord["data_creation_sql"]);
    collectCreationSql(datasetRecord["sql"]);
    collectCreationSql(datasetRecord["dataset_sql"]);
  }

  if (schemaInfo) {
    collectCreationSql(schemaInfo.creation_sql);
    collectCreationSql(schemaInfo.create_sql);
    const schemaDataCreationSql = (schemaInfo as Record<string, unknown>)?.data_creation_sql;
    if (typeof schemaDataCreationSql === "string") {
      collectCreationSql(schemaDataCreationSql);
    }
  }

  if (typeof dataset === "string") {
    collectCreationSql(dataset);
  }

  if (meta?.creationSql) {
    collectCreationSql(meta.creationSql);
  }

  const parseAndAdd = (value?: string | null) => {
    const tableName = extractTableNameFromDescription(value);
    if (tableName) {
      addName(tableName);
    }
  };

  if (datasetRecord) {
    parseAndAdd(datasetRecord["dataset_description"] as string | undefined);
    parseAndAdd(datasetRecord["description"] as string | undefined);
  }

  if (schemaInfo) {
    parseAndAdd((schemaInfo as Record<string, unknown>)?.dataset_description as string | undefined);
  }

  if (meta?.description) {
    parseAndAdd(meta.description);
  }

  return Array.from(normalizedNames.values());
};

const inferTableNameFromSql = (value?: string | null): string | undefined => {
  const tables = extractTableNamesFromSql(value);
  return tables.length > 0 ? tables[0] : undefined;
};

const deriveDatasetKey = (dataset: {
  id?: string | null;
  table_name?: string | null;
  creation_sql?: string | null | undefined;
  create_sql?: string | null | undefined;
}) => {
  if (dataset.id && typeof dataset.id === "string") {
    return `id:${dataset.id}`;
  }
  if (dataset.table_name && typeof dataset.table_name === "string") {
    return `table:${dataset.table_name}`;
  }
  const creationSql = coalesceString(dataset.creation_sql, dataset.create_sql);
  if (creationSql) {
    return `sql:${creationSql}`;
  }
  return undefined;
};

const normalizeDatasetLabel = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : "";
};

const resolveDatasetLabel = (value?: string | null, fallback = "Dataset"): string => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const dedupeByLabel = <T,>(items: T[], getLabel: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeDatasetLabel(getLabel(item));
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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

  const contentText =
    typeof question?.content === "string"
      ? question.content
      : question?.content &&
        typeof (question.content as { text?: unknown }).text === "string"
      ? ((question.content as { text?: string }).text as string)
      : undefined;

  const normalizedTextCandidate = resolveQuestionTextPreservingFormatting(
    typeof question?.text === "string" ? question.text : undefined,
    typeof question?.question_text === "string" ? question.question_text : undefined,
    typeof question?.business_question === "string" ? question.business_question : undefined,
    typeof question?.prompt === "string" ? question.prompt : undefined,
    typeof question?.description === "string" ? question.description : undefined,
    typeof question?.body === "string" ? question.body : undefined,
    contentText,
  );

  const normalizedText =
    normalizedTextCandidate && normalizedTextCandidate.trim().length > 0
      ? normalizedTextCandidate
      : "";

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

  const datasetType = normalizedType;
  const creationSource = coalesceString(
    question?.creation_sql,
    (question as { create_sql?: unknown })?.create_sql,
    question?.dataset,
    question?.sql,
  );
  const normalizedCreationSql = normalizeCreationSql(creationSource, { datasetType });

  return {
    ...question,
    id: normalizedId,
    dataset: normalizeCreationSql(question?.dataset, { datasetType }),
    creation_sql: normalizedCreationSql,
    create_sql: normalizedCreationSql ?? undefined,
    text: normalizedText,
    question_text: normalizedText,
    question_type: normalizedType,
    type: normalizedType,
    exercise_id: normalizedExerciseId,
    order_index: normalizedOrderIndex,
  };
};


const resolveQuestionTextPreservingFormatting = (...sources: Array<unknown>): string => {
  for (const source of sources) {
    if (typeof source === "string" && source.trim().length > 0) {
      return source;
    }
  }

  for (const source of sources) {
    if (typeof source === "string") {
      return source;
    }
  }

  return "";
};

const normalizeAdaptiveQuestion = <T extends Record<string, unknown> | null | undefined>(
  question: T,
): T => {
  if (!question || typeof question !== "object") {
    return question;
  }

  const normalizedText = resolveQuestionTextPreservingFormatting(
    (question as Record<string, unknown>).text,
    (question as Record<string, unknown>).question_text,
    (question as Record<string, unknown>).prompt,
    (question as Record<string, unknown>).content,
  );

  const result = {
    ...question,
  } as Record<string, unknown>;

  if (typeof (question as Record<string, unknown>).text === "string") {
    const textValue = (question as Record<string, unknown>).text as string;
    result.text = textValue.trim().length > 0 ? textValue : normalizedText;
  } else if (normalizedText) {
    result.text = normalizedText;
  }

  result.question_text = normalizedText;

  return result as T;
};

const normalizeAdaptiveSummary = (summary: any) => {
  if (!summary || typeof summary !== "object") {
    return summary;
  }

  const normalizedResponses = Array.isArray(summary.responses)
    ? summary.responses.map((response: any) => normalizeAdaptiveQuestion(response))
    : summary.responses;

  return {
    ...summary,
    current_question: normalizeAdaptiveQuestion(summary.current_question),
    next_question: normalizeAdaptiveQuestion(summary.next_question),
    responses: normalizedResponses,
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
  const [activeSectionQuizzes, setActiveSectionQuizzes] = useState<Record<string, AdaptiveQuizSectionStatus>>({});

  // Authentication state (moved before callbacks that use it)
  const [userId, setUserId] = useState<string | null>(null);
  const isAuthenticated = useMemo(() => Boolean(userId), [userId]);
  
  // Get userId from Supabase
  useEffect(() => {
    const supabase = supabaseBrowser();
    let isMounted = true;

    const syncSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUserId(session?.user?.id ?? null);
      } catch (error) {
        console.error('Failed to get session:', error);
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    syncSession();

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const fetchAdaptiveQuizStatus = useCallback(
    async (sectionId: string, options?: { suppressUpdate?: boolean }): Promise<AdaptiveQuizSectionStatus> => {
      if (!isAuthenticated) {
        return { hasActiveQuiz: false };
      }
      if (!sectionId) {
        return { hasActiveQuiz: false };
      }

      try {
        const response = (await checkAdaptiveQuizStatusAction(sectionId)) as any;
        const normalized: AdaptiveQuizSectionStatus = {
          hasActiveQuiz: Boolean(response?.hasActiveQuiz),
          sessionId: typeof response?.sessionId === "string" ? response.sessionId : undefined,
        };

        if (!options?.suppressUpdate) {
          setActiveSectionQuizzes((prev) => ({
            ...prev,
            [sectionId]: normalized,
          }));
        }

        return normalized;
      } catch (error) {
        console.error(`Failed to check adaptive quiz status for section ${sectionId}:`, error);
        const fallback: AdaptiveQuizSectionStatus = { hasActiveQuiz: false };

        if (!options?.suppressUpdate) {
          setActiveSectionQuizzes((prev) => ({
            ...prev,
            [sectionId]: fallback,
          }));
        }

        return fallback;
      }
    },
    [isAuthenticated],
  );

  // Content generation loading state
  const isGeneratingContentForSection = selectedSectionId
    ? generatingExercise[selectedSectionId] || generatingQuiz[selectedSectionId]
    : false;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const uniqueSectionIds = Array.from(
      new Set(
        (allSections || [])
          .map((section) => section?.id)
          .filter((sectionId): sectionId is string => Boolean(sectionId)),
      ),
    );

    if (!uniqueSectionIds.length) {
      return;
    }

    let isCancelled = false;

    const loadStatuses = async () => {
      const statuses = await Promise.all(
        uniqueSectionIds.map(async (sectionId) => {
          const status = await fetchAdaptiveQuizStatus(sectionId, { suppressUpdate: true });
          return { sectionId, status };
        }),
      );

      if (isCancelled) {
        return;
      }

      setActiveSectionQuizzes((prev) => {
        const updated = { ...prev };
        statuses.forEach(({ sectionId, status }) => {
          updated[sectionId] = status;
        });
        return updated;
      });
    };

    loadStatuses();

    return () => {
      isCancelled = true;
    };
  }, [allSections, fetchAdaptiveQuizStatus, isAuthenticated]);

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
  const [pythonCode , setPythonCode] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('sql');
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
  const [duckDbDatasetTables, setDuckDbDatasetTables] = useState<Record<string, string[]>>({});

  // Python execution state
  const pyodide = usePyodide();
  const {
    isReady: isPyodideReady,
    isLoading: isPyodideLoading,
    error: pyodideError,
    executeCode: executePythonCode,
    loadDataFrame: loadPyodideDataFrame,
  } = pyodide;
  const [isExecutingPython, setIsExecutingPython] = useState(false);
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [pythonError, setPythonError] = useState<string>('');

  const canClearOutput = useMemo(
    () =>
      sqlResults.length > 0 ||
      !!sqlError ||
      !!pythonOutput ||
      !!pythonError ||
      !!duckDbSetupError,
    [sqlResults, sqlError, pythonOutput, pythonError, duckDbSetupError],
  );

  // Dataset state
  const [exerciseDatasets, setExerciseDatasets] = useState<{ [exerciseId: string]: any[] }>({});
  const [loadingExerciseDatasets, setLoadingExerciseDatasets] = useState<Record<string, boolean>>({});
  const [questionDataset, setQuestionDataset] = useState<QuestionDatasetRecord | null>(null);
  const [questionDatasetCache, setQuestionDatasetCache] = useState<Record<string, QuestionDatasetRecord | null>>({});
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [questionCompletionStatus, setQuestionCompletionStatus] = useState<Record<string, "pending" | "completed">>({});
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null);
  const [loadingDatasetPreview, setLoadingDatasetPreview] = useState(false);
  const [datasetPreviewError, setDatasetPreviewError] = useState<string | null>(null);
  const [downloadingDataset, setDownloadingDataset] = useState(false);
  const [pythonDatasetStatus, setPythonDatasetStatus] = useState<Record<string, PythonDatasetLoadState>>({});
const datasetPreviewCacheRef = useRef<Record<string, Record<string, DatasetPreview>>>({});
const activeDatasetPreviewRequestRef = useRef<string | null>(null);
const datasetAvailabilitySignatureRef = useRef<string | null>(null);
const sqlStarterAppliedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    datasetPreviewCacheRef.current = {};
    activeDatasetPreviewRequestRef.current = null;
  }, [courseId, subjectId]);

  const handleClearOutput = useCallback(() => {
    setSqlResults([]);
    setSqlError('');
    setPythonOutput('');
    setPythonError('');
    setDuckDbSetupError(null);
  }, []);

  const downloadDatasetPreview = useCallback(
    async ({
      fileName,
      worksheetName,
    }: {
      fileName?: string;
      worksheetName?: string;
    }) => {
      if (!datasetPreview || datasetPreview.columns.length === 0) {
        return;
      }

      const sanitizeForFile = (value: string) =>
        value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim();

      const safeWorksheetName = sanitizeForFile(worksheetName ?? "Dataset").slice(0, 31) || "Sheet1";
      const safeFileName = (sanitizeForFile(fileName ?? "dataset") || "dataset").slice(0, 120);

      const normalizeCellForExport = (value: unknown) => {
        if (value === null || value === undefined) {
          return "";
        }
        if (typeof value === "bigint") {
          return value.toString();
        }
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }
        return value;
      };

      try {
        setDownloadingDataset(true);
        const XLSX = await import("xlsx");
        const worksheetData = [
          datasetPreview.columns,
          ...datasetPreview.rows.map((row) => row.map((cell) => normalizeCellForExport(cell))),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, safeWorksheetName);
        XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
      } catch (error) {
        console.error("Failed to export dataset preview", error);
      } finally {
        setDownloadingDataset(false);
      }
    },
    [datasetPreview],
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const toggleContentExpanded = useCallback(() => {
    setIsContentExpanded((prev) => !prev);
  }, []);
  const closeNavigation = useCallback(() => {
    setIsContentExpanded(true);
  }, []);

  const renderContentExpansionToggle = useCallback(
    (variant: "light" | "dark" = "light") => (
      <button
        type="button"
        onClick={toggleContentExpanded}
        className={`group inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          variant === "dark"
            ? "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            : "border-slate-200 bg-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
        aria-label={isContentExpanded ? "Show course navigation" : "Hide course navigation"}
      >
        {isContentExpanded ? (
          <ChevronLeft className={`h-4 w-4 ${variant === "dark" ? "text-white" : "text-slate-500"}`} />
        ) : (
          <ChevronRight className={`h-4 w-4 ${variant === "dark" ? "text-white" : "text-slate-500"}`} />
        )}
        <span
          className={`ml-2 hidden sm:inline ${
            variant === "dark" ? "text-white/80" : "text-slate-600"
          }`}
        >
          {isContentExpanded ? "Show Outline" : "Hide Outline"}
        </span>
      </button>
    ),
    [isContentExpanded, toggleContentExpanded],
  );

  // Adaptive Quiz state
  const [isAdaptiveQuizMode, setIsAdaptiveQuizMode] = useState(false);
  const [adaptiveQuizSession, setAdaptiveQuizSession] = useState<any>(null);
  const [currentAdaptiveQuestion, setCurrentAdaptiveQuestion] = useState<any>(null);
  const [adaptiveQuizAnswer, setAdaptiveQuizAnswer] = useState<string>('');
  const [adaptiveQuizCompleted, setAdaptiveQuizCompleted] = useState(false);
  const [adaptiveQuizSummary, setAdaptiveQuizSummary] = useState<any>(null);
  const [submittingAdaptiveAnswer, setSubmittingAdaptiveAnswer] = useState(false);
  const [pendingAdaptiveQuestion, setPendingAdaptiveQuestion] = useState<any>(null);
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

  const isSpreadsheetQuestion = selectedQuestionType === "google_sheets";
  const isPythonLikeQuestion = selectedQuestionType === "python";
  const shouldUseDuckDb = selectedQuestionType === "sql" || selectedQuestionType === "statistics" || selectedQuestionType === "python";
 

  // Function to fetch exercise datasets
  const fetchExerciseDatasets = useCallback(async (exerciseId: string) => {
    if (!isAuthenticated) return;
    if (loadingExerciseDatasets[exerciseId] || exerciseDatasets[exerciseId]) return;

    setLoadingExerciseDatasets(prev => ({ ...prev, [exerciseId]: true }));
    try {
      const response = await getExerciseDatasetsAction(exerciseId) as any;
      if (response && response.data) {
        const normalizedDatasets = Array.isArray(response.data)
          ? response.data.map((dataset: any) => {
              const datasetType = resolveDatasetLanguage(
                dataset?.subject_type,
                dataset?.type,
                dataset?.question_type,
              );
              const normalized = normalizeQuestionDataset(dataset, {
                questionId:
                  typeof dataset?.question_id === "string" || typeof dataset?.question_id === "number"
                    ? String(dataset.question_id)
                    : undefined,
                questionTitle: dataset?.name,
                subjectType: datasetType,
              });
              if (normalized) {
                return normalized;
              }
              const fallbackCreationSource = coalesceString(
                dataset?.creation_sql,
                dataset?.create_sql,
                dataset?.sql,
                dataset?.dataset,
              );
              const fallbackCreationSql = normalizeCreationSql(fallbackCreationSource, {
                datasetType,
              });
              return {
                ...dataset,
                creation_sql: fallbackCreationSql,
                create_sql: fallbackCreationSql ?? undefined,
              };
            })
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
  }, [loadingExerciseDatasets, exerciseDatasets, isAuthenticated]);

  // Function to fetch section quizzes
  const fetchSectionQuizzes = useCallback(async (sectionId: string) => {
    if (!isAuthenticated) return;
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
  }, [loadingSectionQuizzes, sectionQuizzes, isAuthenticated]);

  // SQL execution will be handled by backend API

  // Database initialization is now handled by backend API

  const autoScrollArmedRef = useRef(Boolean(initialModuleSlug));

  // Function to fetch section exercises
  const fetchSectionExercises = useCallback(async (sectionId: string) => {
    if (!isAuthenticated) return;
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
        const derivedDatasetCache: Record<string, QuestionDatasetRecord[]> = {};
        const normalizedExercises = Array.isArray(response.data)
          ? response.data.map((exercise: any) => {
              const exerciseDatasetType = resolveDatasetLanguage(
                exercise?.subject_type,
                exercise?.exercise_type,
                exercise?.practice_type,
                exercise?.type,
              );
              const normalizedExerciseDataset = normalizeCreationSql(exercise?.data, {
                datasetType: exerciseDatasetType,
              });
              const normalizedContext = exercise?.context
                ? (() => {
                    const contextCreationSource = coalesceString(
                      exercise.context?.data_creation_sql,
                      exercise.context?.create_sql,
                    );
                    const contextCreationSql = normalizeCreationSql(contextCreationSource, {
                      datasetType: exerciseDatasetType,
                    });
                    const contextCsv =
                      typeof exercise.context.dataset_csv_raw === "string" &&
                      exercise.context.dataset_csv_raw.trim().length > 0
                        ? extractCsvFromSource(exercise.context.dataset_csv_raw) ??
                          exercise.context.dataset_csv_raw
                        : extractCsvFromSource(contextCreationSql);
                    const contextRows =
                      contextCsv && contextCsv.trim().length > 0
                        ? parseCsvToObjects(contextCsv)
                        : [];
                    const contextColumns =
                      Array.isArray(exercise.context.dataset_columns) &&
                      exercise.context.dataset_columns.length > 0
                        ? exercise.context.dataset_columns
                        : contextRows.length > 0
                        ? Object.keys(contextRows[0])
                        : exercise.context.expected_cols_list?.[0] || [];
                    const contextPayload =
                      exerciseDatasetType === "google_sheets"
                        ? contextCsv ?? contextCreationSql ?? ""
                        : contextCreationSql ?? "";
                    return {
                      ...exercise.context,
                      data_creation_sql: contextPayload,
                      create_sql: contextCreationSql ?? undefined,
                      dataset_csv_raw: contextCsv,
                      dataset_columns: contextColumns,
                    };
                  })()
                : exercise?.context;
              const datasetPayload =
                exerciseDatasetType === "google_sheets"
                  ? normalizedContext?.dataset_csv_raw ?? normalizedExerciseDataset ?? ""
                  : normalizedExerciseDataset ?? "";
              const normalizedExercise = {
                ...exercise,
                // Map 'data' field from backend to 'dataset' field expected by frontend
                dataset: datasetPayload,
                section_exercise_questions: Array.isArray(exercise?.section_exercise_questions)
                  ? exercise.section_exercise_questions.map((question: any, index: number) =>
                      normalizeSectionExerciseQuestion(question, {
                        exerciseId: exercise?.id ? String(exercise.id) : undefined,
                        fallbackIndex: index,
                      }),
                    )
                  : exercise?.section_exercise_questions,
                context: normalizedContext,
              };
              const exerciseKey =
                typeof normalizedExercise?.id === "string"
                  ? normalizedExercise.id
                  : typeof normalizedExercise?.id === "number"
                  ? String(normalizedExercise.id)
                  : undefined;
              if (exerciseKey) {
                const derivedDatasets = deriveExerciseDatasets(normalizedExercise, {
                  datasetType: exerciseDatasetType,
                });
                if (derivedDatasets.length) {
                  derivedDatasetCache[exerciseKey] = derivedDatasets;
                }
              }
              return normalizedExercise;
            })
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

        if (Object.keys(derivedDatasetCache).length > 0) {
          setExerciseDatasets(prev => {
            let changed = false;
            const next = { ...prev };
            for (const [exerciseId, datasets] of Object.entries(derivedDatasetCache)) {
              if (Array.isArray(next[exerciseId]) && next[exerciseId].length > 0) {
                continue;
              }
              next[exerciseId] = datasets;
              changed = true;
            }
            return changed ? next : prev;
          });
        }
      }
    } catch (error) {
      console.error('[FETCH EXERCISES DEBUG] Failed to fetch section exercises:', error);
    } finally {
      setLoadingSectionExercises(prev => ({ ...prev, [sectionId]: false }));
    }
  }, [loadingSectionExercises, sectionExercises, isAuthenticated]);

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

  const fetchQuestionDataset = useCallback(
    async (
      questionId: string,
      context?: { questionTitle?: string; questionType?: string | null },
    ) => {
      if (!isAuthenticated) return;
      if (!questionId) return;

      const cached = questionDatasetCache[questionId];
      if (cached !== undefined) {
        setQuestionDataset(cached);
        return;
      }

      setLoadingDataset(true);
      try {
        const result = await apiGet<{ data?: QuestionDatasetRecord | null } | QuestionDatasetRecord | null>(
          `/v1/sections/questions/${questionId}/dataset`,
        );
        const datasetPayload =
          result && typeof result === "object" && "data" in result ? (result as { data?: QuestionDatasetRecord | null }).data : (result as QuestionDatasetRecord | null);
        const normalizedDataset = normalizeQuestionDataset(datasetPayload, {
          questionId,
          questionTitle: context?.questionTitle,
          subjectType: context?.questionType,
        });
        setQuestionDataset(normalizedDataset);
        setQuestionDatasetCache((prev) => ({
          ...prev,
          [questionId]: normalizedDataset,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes(" 404")) {
          setQuestionDataset(null);
          setQuestionDatasetCache((prev) => ({
            ...prev,
            [questionId]: null,
          }));
        } else {
          console.error("Error fetching dataset:", error);
          setQuestionDataset(null);
          setQuestionDatasetCache((prev) => ({
            ...prev,
            [questionId]: null,
          }));
        }
      } finally {
        setLoadingDataset(false);
      }
    },
    [questionDatasetCache, setQuestionDatasetCache, isAuthenticated],
  );

  // Generation functions with progressive loading
  const handleGenerateExercise = useCallback(async (section: Section) => {
    if (!isAuthenticated) {
      console.warn('Attempted to generate exercise without authentication');
      return;
    }
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

        const creationSqlSource = coalesceString(context.data_creation_sql, (context as any)?.create_sql);
        const normalizedCreationSql = normalizeCreationSql(creationSqlSource, {
          datasetType: normalizedQuestionType,
        });
        const creationPythonSource = coalesceString(
          context.data_creation_python,
          (context as any)?.create_python,
          (context as any)?.creation_python,
        );
        const normalizedCreationPython = normalizeCreationSql(creationPythonSource, {
          datasetType: "python",
          preserveFormatting: true,
        });

        const normalizedDatasetCsv =
          typeof context.dataset_csv_raw === "string" && context.dataset_csv_raw.trim().length > 0
            ? extractCsvFromSource(context.dataset_csv_raw) ?? context.dataset_csv_raw
            : extractCsvFromSource(normalizedCreationSql);
        const datasetRows =
          normalizedDatasetCsv && normalizedDatasetCsv.trim().length > 0
            ? parseCsvToObjects(normalizedDatasetCsv)
            : [];
        const datasetColumns =
          Array.isArray(context.dataset_columns) && context.dataset_columns.length > 0
            ? context.dataset_columns
            : datasetRows.length > 0
            ? Object.keys(datasetRows[0])
            : context.expected_cols_list?.[0] || [];
        const datasetSqlPayload =
          normalizedQuestionType === "google_sheets"
            ? normalizedDatasetCsv ?? normalizedCreationSql ?? ""
            : normalizedCreationSql ?? "";
        const datasetPythonPayload =
          normalizedCreationPython ??
          (normalizedQuestionType === "python" || normalizedQuestionType === "statistics"
            ? normalizedCreationSql
            : undefined);
        const normalizedContext = {
          ...context,
          data_creation_sql: datasetSqlPayload,
          create_sql: normalizedCreationSql ?? undefined,
          dataset_csv_raw: normalizedDatasetCsv,
          dataset_columns: datasetColumns,
          data_creation_python: normalizedCreationPython ?? context.data_creation_python,
          create_python: normalizedCreationPython ?? (context as any)?.create_python ?? (context as any)?.creation_python,
          creation_python: normalizedCreationPython ?? (context as any)?.creation_python ?? (context as any)?.create_python,
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
                dataset: datasetSqlPayload,
              }));

        const updatedExercise = {
          ...result.exercise,
          questions: derivedQuestions,
        };

        const normalizedExerciseEntry = {
          ...updatedExercise,
          section_exercise_questions: derivedQuestions,
          dataset: datasetSqlPayload,
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
              columns: datasetColumns,
              creation_sql: datasetSqlPayload,
              create_sql: datasetSqlPayload,
              dataset_csv_raw: normalizedDatasetCsv,
              data: datasetRows,
              data_preview: datasetRows.slice(0, 20),
              data_dictionary: context.data_dictionary,
              creation_python: datasetPythonPayload,
              create_python: datasetPythonPayload,
              data_creation_python: datasetPythonPayload,
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
              exerciseDataset: datasetSqlPayload,
              exercisePythonDataset: datasetPythonPayload,
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
    isAuthenticated,
    userId,
  ]);

  // Adaptive Quiz Handlers
  const handleStartAdaptiveQuiz = useCallback(async (section: Section) => {
    if (!isAuthenticated) {
      console.warn('Attempted to start adaptive quiz without authentication');
      return;
    }
    if (generatingQuiz[section.id] || isAdaptiveQuizMode) return;

    setGeneratingQuiz(prev => ({ ...prev, [section.id]: true }));
    try {
      const status = await fetchAdaptiveQuizStatus(section.id);
      const shouldResume = status?.hasActiveQuiz;

      const result = shouldResume
        ? ((await resumeAdaptiveQuizAction({ sectionId: section.id })) as any)
        : ((await startAdaptiveQuizAction({
            courseId,
            subjectId,
            sectionId: section.id,
            sectionTitle: section.title || '',
            difficulty: 'Beginner',
            targetLength: 10,
          })) as any);

      if (!result || !result.session) {
        return;
      }

      const nextQuestion = result.currentQuestion ?? result.firstQuestion;

      if (result.stop) {
        setAdaptiveQuizSession(result.session);
        setAdaptiveQuizCompleted(true);
        setIsAdaptiveQuizMode(true);
        setAdaptiveQuizAnswer('');
        setPendingAdaptiveQuestion(null);
        setSubmittingAdaptiveAnswer(false);
        setShowAdaptiveExplanation(false);
        setLastAnswerCorrect(null);

        try {
          const summaryResult = await getAdaptiveQuizSummaryAction(result.session.id);
          if (summaryResult) {
            setAdaptiveQuizSummary(normalizeAdaptiveSummary(summaryResult));
          }
        } catch (summaryError) {
          console.error('Failed to fetch adaptive quiz summary:', summaryError);
        }

        await fetchAdaptiveQuizStatus(section.id);
        return;
      }

      if (!nextQuestion) {
        console.warn('Adaptive quiz response missing next question');
        await fetchAdaptiveQuizStatus(section.id);
        return;
      }

      setAdaptiveQuizSession(result.session);
      setCurrentAdaptiveQuestion(normalizeAdaptiveQuestion(nextQuestion));
      setIsAdaptiveQuizMode(true);
      setAdaptiveQuizCompleted(false);
      setAdaptiveQuizAnswer('');
      setPendingAdaptiveQuestion(null);
      setSubmittingAdaptiveAnswer(false);
      setShowAdaptiveExplanation(false);
      setLastAnswerCorrect(null);
      setAdaptiveQuizSummary(null);

      setActiveSectionQuizzes(prev => ({
        ...prev,
        [section.id]: {
          hasActiveQuiz: true,
          sessionId: result.session.id,
        },
      }));
    } catch (error) {
      console.error('Failed to start or resume adaptive quiz:', error);
    } finally {
      setGeneratingQuiz(prev => ({ ...prev, [section.id]: false }));
    }
  }, [generatingQuiz, isAdaptiveQuizMode, fetchAdaptiveQuizStatus, courseId, subjectId, isAuthenticated]);

  const handleAdaptiveQuizSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('Attempted to submit adaptive quiz without authentication');
      return;
    }
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
        const sectionIdForStatus = adaptiveQuizSession?.section_id;
        if (sectionIdForStatus) {
          setActiveSectionQuizzes(prev => ({
            ...prev,
            [sectionIdForStatus]: { hasActiveQuiz: false },
          }));
        }

        const summaryResult = await getAdaptiveQuizSummaryAction(adaptiveQuizSession.id);
        if (summaryResult) {
          setAdaptiveQuizSummary(normalizeAdaptiveSummary(summaryResult));
        }

        if (sectionIdForStatus) {
          await fetchAdaptiveQuizStatus(sectionIdForStatus);
        }
      } else if (result?.question) {
        setPendingAdaptiveQuestion(normalizeAdaptiveQuestion(result.question));
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
    fetchAdaptiveQuizStatus,
    isAuthenticated,
  ]);

  const handleAdaptiveQuizNext = useCallback(() => {
    if (!pendingAdaptiveQuestion) {
      return;
    }

    setCurrentAdaptiveQuestion(normalizeAdaptiveQuestion(pendingAdaptiveQuestion));
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

      const exerciseDatasetType = resolveDatasetLanguage(
        exercise?.subject_type,
        exercise?.exercise_type,
        exercise?.practice_type,
        exercise?.type,
      );

      const normalizedExercise = {
        ...exercise,
        dataset: normalizeCreationSql(exercise?.dataset, { datasetType: exerciseDatasetType }),
        section_exercise_questions: normalizedQuestions,
      };

      setSelectedPracticeExercise(normalizedExercise);
      setPracticeQuestions(normalizedQuestions);
      setShowQuestionPopup(false);
      setSelectedQuestionForPopup(null);
      setIsPracticeMode(true);
      setPracticeDatasets([]);

      const exerciseKey =
        typeof normalizedExercise?.id === "string"
          ? normalizedExercise.id
          : typeof normalizedExercise?.id === "number"
          ? String(normalizedExercise.id)
          : null;
      const cachedDatasets =
        exerciseKey &&
        Array.isArray(exerciseDatasets[exerciseKey]) &&
        exerciseDatasets[exerciseKey].length > 0
          ? (exerciseDatasets[exerciseKey] as QuestionDatasetRecord[])
          : [];
      let practiceDatasetSource = cachedDatasets;

      if (!practiceDatasetSource.length) {
        const derivedDatasets = deriveExerciseDatasets(normalizedExercise, {
          datasetType: exerciseDatasetType,
        });
        if (derivedDatasets.length) {
          practiceDatasetSource = derivedDatasets;
          if (exerciseKey) {
            setExerciseDatasets(prev => {
              const existing = prev[exerciseKey];
              if (Array.isArray(existing) && existing.length > 0) {
                return prev;
              }
              return {
                ...prev,
                [exerciseKey]: derivedDatasets,
              };
            });
          }
        }
      }

      if (practiceDatasetSource.length) {
        setPracticeDatasets(practiceDatasetSource);
        return;
      }

      try {
        const response = (await getExerciseDatasetsAction(exercise.id)) as any;
        if (response && response.data) {
          const normalizedDatasets = Array.isArray(response.data)
            ? response.data.map((dataset: any) => {
                const datasetType = resolveDatasetLanguage(
                  dataset?.subject_type,
                  dataset?.type,
                  dataset?.question_type,
                  exerciseDatasetType,
                );
                const creationSqlSource = coalesceString(
                  dataset?.creation_sql,
                  dataset?.create_sql,
                  dataset?.sql,
                  dataset?.dataset,
                );
                const normalizedCreationSql = normalizeCreationSql(creationSqlSource, {
                  datasetType,
                });
                return {
                  ...dataset,
                  creation_sql: normalizedCreationSql,
                  create_sql: normalizedCreationSql ?? undefined,
                };
              })
            : [];
          setPracticeDatasets(normalizedDatasets);
          if (exerciseKey) {
            setExerciseDatasets(prev => ({
              ...prev,
              [exerciseKey]: normalizedDatasets,
            }));
          }
        } else {
          setPracticeDatasets([]);
        }
      } catch (error) {
        console.error('Failed to fetch practice datasets:', error);
        setPracticeDatasets([]);
      }

      // Practice mode already enabled above
    },
    [exerciseDatasets, getExerciseDatasetsAction],
  );

  const handleExitPractice = useCallback(() => {
    setIsPracticeMode(false);
    setSelectedPracticeExercise(null);
    setPracticeQuestions([]);
    setPracticeDatasets([]);
  }, []);

  const handleExitEmbeddedExercise = useCallback(() => {
    setSelectedQuestionForPopup(null);
    setShowQuestionPopup(false);
    setSqlCode('');
    setPythonCode('');
    setSqlResults([]);
    setSqlError('');
    setSelectedResource((prev) => {
      if (!selectedSection) {
        if (prev && prev.kind === "exercise") {
          return null;
        }
        return prev;
      }

      if (!prev || prev.kind !== "exercise" || prev.sectionId !== selectedSection.id) {
        return prev;
      }

      const fallback = getDefaultResource(selectedSection);
      if (!fallback) {
        return null;
      }

      if (fallback.kind === "exercise" && fallback.resourceId === prev.resourceId) {
        return null;
      }

      return fallback;
    });
  }, [selectedSection]);

  const handlePracticeSubmit = useCallback(async (questionId: string, solution: string) => {
    if (!userId) {
      return {
        success: false,
        feedback: "Authentication required. Please refresh the page.",
      };
    }

    try {
      const result = await apiPost<{ is_correct?: boolean; feedback?: string; success?: boolean }>(
        "/v1/practice-exercises/attempt",
        {
          question_id: questionId,
          submitted_answer: solution,
          attempted_at: new Date().toISOString(),
        },
      );

      const isCorrect = typeof result?.is_correct === "boolean" ? result.is_correct : Boolean(result?.success);
      return {
        success: true,
        isCorrect,
        feedback: result?.feedback || "Solution submitted successfully!",
      };
    } catch (error) {
      console.error("Error submitting practice attempt:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("401")) {
        return {
          success: false,
          feedback: "Authentication required. Please refresh the page.",
        };
      }
      return {
        success: false,
        feedback: "Failed to submit solution. Please try again.",
      };
    }
  }, [userId]);

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
    if (!isAuthenticated) return;
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
          const sectionId = selectedSection.id;
          const prevResourceId = prev.resourceId != null ? String(prev.resourceId) : null;
          const dynamicExercises =
            sectionId && Array.isArray(sectionExercises[sectionId])
              ? sectionExercises[sectionId].filter(Boolean)
              : [];
          const staticExercises = getExercises(selectedSection);

          const matchesDynamic =
            prevResourceId !== null &&
            dynamicExercises.some(
              (exercise: any) => exercise?.id != null && String(exercise.id) === prevResourceId,
            );
          const matchesStatic =
            prevResourceId !== null &&
            staticExercises.some(
              (exercise) => exercise?.id != null && String(exercise.id) === prevResourceId,
            );

          if (matchesDynamic || matchesStatic) {
            return prev;
          }

          const fallbackList = dynamicExercises.length ? dynamicExercises : staticExercises;
          const fallbackExercise = fallbackList.find((exercise: any) => exercise?.id != null);

          if (fallbackExercise) {
            return {
              sectionId,
              kind: "exercise",
              resourceId:
                fallbackExercise.id != null ? String(fallbackExercise.id) : undefined,
            };
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

  }, [selectedSection, fetchSectionExercises, fetchSectionQuizzes, sectionExercises, isAuthenticated]);

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
    if (!isAuthenticated) return;
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
  }, [selectedResource, loadedQuiz, quizLoading, isAuthenticated]);

  // Handle quiz completion in runner mode
  const handleQuizComplete = useCallback(async (sectionId: string, score: number, answers: Record<string, string[]>) => {
    const stopThreshold = 80; // Stop if score >= 80%

    const sectionQuizList = sectionQuizzes[sectionId] || [];
    const candidateQuizzes: Quiz[] = [];

    if (loadedQuiz && (!selectedResource || selectedResource.sectionId === sectionId)) {
      candidateQuizzes.push(loadedQuiz);
    }

    if (quizSession?.quizzes?.length) {
      candidateQuizzes.push(...quizSession.quizzes);
    }

    if (sectionQuizList.length) {
      candidateQuizzes.push(...sectionQuizList);
    }

    const preferredQuizIds = [
      quizSession?.currentQuizId,
      selectedResource?.kind === "quiz" && selectedResource.sectionId === sectionId ? selectedResource.resourceId : undefined,
    ].filter((value): value is string => Boolean(value));

    let quizQuestions: QuizQuestion[] = [];

    for (const quizId of preferredQuizIds) {
      const matchedQuiz = candidateQuizzes.find((quiz) => quiz.id === quizId);
      if (matchedQuiz?.quiz_questions?.length) {
        quizQuestions = matchedQuiz.quiz_questions;
        break;
      }
    }

    if (!quizQuestions.length) {
      const fallbackQuiz = candidateQuizzes.find((quiz) => quiz.quiz_questions && quiz.quiz_questions.length);
      if (fallbackQuiz?.quiz_questions) {
        quizQuestions = fallbackQuiz.quiz_questions;
      }
    }

    const normalizeDifficulty = (value: unknown): "hard" | "medium" | "easy" | null => {
      if (typeof value !== "string") return null;
      const normalized = value.trim().toLowerCase();
      if (!normalized) return null;
      if (["hard", "advanced", "challenging"].includes(normalized)) return "hard";
      if (["medium", "moderate", "intermediate"].includes(normalized)) return "medium";
      if (["easy", "beginner", "simple"].includes(normalized)) return "easy";
      return null;
    };

    const getQuestionDifficulty = (question: QuizQuestion): "hard" | "medium" | "easy" | null => {
      const data = question as Record<string, any>;
      const candidates = [
        data?.difficulty,
        data?.difficulty_level,
        data?.question_difficulty,
        data?.metadata?.difficulty,
        data?.meta?.difficulty,
        data?.content?.difficulty,
        data?.quiz_metadata?.difficulty,
        data?.question_metadata?.difficulty,
      ];

      for (const candidate of candidates) {
        const normalized = normalizeDifficulty(candidate);
        if (normalized) {
          return normalized;
        }
      }

      return null;
    };

    const normalizeAnswer = (value: unknown): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

    let hardCorrectCount = 0;
    let mediumCorrectCount = 0;

    quizQuestions.forEach((question, index) => {
      const answerKey = question.id ?? index.toString();
      const userAnswer = answers[answerKey];
      if (!userAnswer || userAnswer.length === 0) {
        return;
      }

      const normalizedUserAnswer = normalizeAnswer(userAnswer[0]);
      if (!normalizedUserAnswer) {
        return;
      }

      const correctOptions = (question.quiz_options || []).filter((option) => option?.correct);
      if (correctOptions.length === 0) {
        return;
      }

      const isCorrect = correctOptions.some(
        (option) => normalizeAnswer(option?.text) === normalizedUserAnswer,
      );

      if (!isCorrect) {
        return;
      }

      const difficulty = getQuestionDifficulty(question);
      if (difficulty === "hard") {
        hardCorrectCount += 1;
      } else if (difficulty === "medium") {
        mediumCorrectCount += 1;
      }
    });

    const stop =
      score >= stopThreshold ||
      hardCorrectCount >= 5 ||
      mediumCorrectCount >= 6;

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
  }, [courseId, subjectId, sectionQuizzes, allSections, quizSession, loadedQuiz, selectedResource]);

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

  const datasetCacheScopeKey = useMemo(() => {
    const questionExerciseId =
      selectedQuestionForPopup && (selectedQuestionForPopup as any)?.exerciseId
        ? String((selectedQuestionForPopup as any).exerciseId)
        : null;
    if (questionExerciseId) {
      return `exercise:${questionExerciseId}`;
    }
    if (activeExercise?.id) {
      return `exercise:${String(activeExercise.id)}`;
    }
    return `subject:${courseId}:${subjectId}`;
  }, [
    activeExercise?.id,
    courseId,
    subjectId,
    selectedQuestionForPopup ? (selectedQuestionForPopup as any)?.exerciseId : null,
  ]);

  useEffect(() => {
    if (!datasetPreviewCacheRef.current[datasetCacheScopeKey]) {
      datasetPreviewCacheRef.current[datasetCacheScopeKey] = {};
    }
    datasetAvailabilitySignatureRef.current = null;
    activeDatasetPreviewRequestRef.current = null;
  }, [datasetCacheScopeKey]);

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

      const questionId =
        typeof (question as { id?: unknown })?.id === "string" || typeof (question as { id?: unknown })?.id === "number"
          ? String((question as { id?: string | number }).id)
          : undefined;
      const questionTitle =
        (typeof (question as { question_text?: string })?.question_text === "string" &&
        (question as { question_text?: string }).question_text?.trim())
          ? (question as { question_text?: string }).question_text
          : (typeof (question as { text?: string })?.text === "string" &&
            (question as { text?: string }).text?.trim())
          ? (question as { text?: string }).text
          : exerciseContext?.title;

      const rawQuestionType =
        typeof (question as { question_type?: string })?.question_type === "string" &&
        (question as { question_type?: string }).question_type?.trim()
          ? (question as { question_type?: string }).question_type
          : typeof (question as { type?: string })?.type === "string" &&
            (question as { type?: string }).type?.trim()
          ? (question as { type?: string }).type
          : undefined;
      const questionType =
        typeof rawQuestionType === "string" && rawQuestionType.trim()
          ? rawQuestionType.trim().toLowerCase()
          : undefined;

      const exerciseDatasetType = resolveDatasetLanguage(
        questionType,
        exerciseContext?.practice_type,
        exerciseContext?.exercise_type,
        exerciseContext?.subject_type,
      );
      const rawExerciseDataset = (question as any)?.exerciseDataset ?? exerciseContext.dataset;
      const exerciseDatasetSql = normalizeCreationSql(rawExerciseDataset, {
        datasetType: exerciseDatasetType,
      });
      const rawExercisePythonDataset =
        (question as any)?.exercisePythonDataset ??
        (exerciseContext as any)?.dataset_python ??
        (exerciseContext as any)?.data_creation_python;
      const exercisePythonDataset = normalizeCreationSql(rawExercisePythonDataset, {
        datasetType: "python",
        preserveFormatting: true,
      });

      setSelectedQuestionForPopup({
        ...question,
        exerciseId: exerciseContext.id ? String(exerciseContext.id) : null,
        exerciseTitle: exerciseContext.title,
        exerciseDescription: exerciseContext.description,
        exerciseDataset: exerciseDatasetSql,
        exercisePythonDataset: exercisePythonDataset ?? undefined,
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
        question_type: questionType ?? "sql",
      });
      setSqlCode('');
      setSqlResults([]);
      setSqlError('');
      setPythonCode('');

      const cachedDataset = questionId ? questionDatasetCache[questionId] : undefined;
      const inlineDataset = normalizeQuestionDataset((question as { dataset?: unknown }).dataset, {
        questionId,
        questionTitle,
        subjectType: questionType,
      });

      if (inlineDataset) {
        setQuestionDataset(inlineDataset);
        if (questionId) {
          setQuestionDatasetCache((prev) => ({
            ...prev,
            [questionId]: inlineDataset,
          }));
        }
        if (
          questionId &&
          cachedDataset === undefined &&
          (!inlineDataset.creation_sql ||
            !Array.isArray(inlineDataset.data) ||
            inlineDataset.data.length === 0) &&
          !inlineDataset.dataset_csv_raw
        ) {
          fetchQuestionDataset(questionId, { questionTitle, questionType });
        }
      } else if (cachedDataset !== undefined) {
        setQuestionDataset(cachedDataset);
      } else {
        setQuestionDataset(null);
        if (questionId) {
          fetchQuestionDataset(questionId, { questionTitle, questionType });
        }
      }
    },
    [activeExercise, fetchQuestionDataset, questionDatasetCache, setQuestionDatasetCache],
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

  // Python execution handler
  const handleExecutePython = useCallback(
    async (code: string) => {
      if (!code.trim() || isExecutingPython) {
        return;
      }

      if (selectedQuestionType && !isPythonLikeQuestion) {
        setPythonError("Python execution is only available for Python or Statistics questions.");
        return;
      }

      if (!isPyodideReady) {
        setPythonError("Python runtime is still initializing. Please wait a moment and try again.");
        return;
      }

      setIsExecutingPython(true);
      setPythonError("");
      setPythonOutput("");

      try {
        const result = await executePythonCode(code);
        if (!result.success) {
          throw new Error(result.error || "Python execution failed");
        }

        setPythonOutput(result.output || "Code executed successfully (no output)");
        markQuestionCompleted(selectedQuestionForPopup);
      } catch (error) {
        console.error("Python execution error:", error);
        setPythonError(error instanceof Error ? error.message : "An error occurred while executing Python");
      } finally {
        setIsExecutingPython(false);
      }
    },
    [
      executePythonCode,
      isPyodideReady,
      isExecutingPython,
      markQuestionCompleted,
      selectedQuestionForPopup,
      isPythonLikeQuestion,
      selectedQuestionType,
    ],
  );

  // Generic code execution handler that routes to the appropriate executor
  const handleExecuteCode = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        return;
      }

      const questionType = selectedQuestionType?.toLowerCase();

      if (questionType === "sql") {
        await handleExecuteSQL(code);
      } else if (questionType === "python" || questionType === "statistics") {
        await handleExecutePython(code);
      } else {
        // For other question types, show an appropriate message
        setSqlError(`Code execution is not yet supported for ${questionType || 'this'} question type.`);
      }
    },
    [selectedQuestionType, handleExecuteSQL, handleExecutePython],
  );

  const handleSelectExercise = useCallback(
    (sectionId: string, exercise: any) => {

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
        const exerciseDatasetType = resolveDatasetLanguage(
          exercise?.subject_type,
          exercise?.exercise_type,
          exercise?.practice_type,
          exercise?.type,
        );
        setActiveExerciseQuestion(
          {
            ...firstQuestion,
            exerciseId: exercise.id ? String(exercise.id) : null,
            exerciseTitle: exercise.title,
            exerciseDescription: exercise.description,
            exerciseDataset: normalizeCreationSql(exercise.dataset, {
              datasetType: exerciseDatasetType,
            }),
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
    if (!isAuthenticated) return;
    if (activeExercise?.id) {
      fetchExerciseDatasets(activeExercise.id);
    }
  }, [activeExercise?.id, fetchExerciseDatasets, isAuthenticated]);

  const exerciseDatasetList = useMemo(() => {
    if (!activeExercise?.id) {
      return [];
    }
    return exerciseDatasets[activeExercise.id] || [];
  }, [activeExercise?.id, exerciseDatasets]);

  const spreadsheetDatasets = useMemo(
    () =>
          isSpreadsheetQuestion
        ? (() => {
            const datasets: SpreadsheetDatasetDefinition[] = [];
            const seenIds = new Set<string>();
            const seenLabels = new Set<string>();

            const pushDataset = (
              rawDataset: unknown,
              meta: {
                id?: string | null;
                name?: string | null;
                description?: string | null;
              } = {},
            ) => {
              if (!rawDataset) {
                return;
              }

              const preview = buildDatasetPreviewFromRecord(rawDataset);
              const isObject =
                rawDataset && typeof rawDataset === "object" && !Array.isArray(rawDataset);
              const datasetRecord = isObject ? (rawDataset as Record<string, unknown>) : null;

              const candidateId =
                (typeof meta.id === "string" && meta.id.trim()) ||
                (isObject &&
                  typeof datasetRecord?.id === "string" &&
                  (datasetRecord.id as string).trim()) ||
                (isObject &&
                  typeof datasetRecord?.table_name === "string" &&
                  (datasetRecord.table_name as string).trim()) ||
                undefined;

              let datasetId = candidateId ?? `dataset-${datasets.length}`;
              while (seenIds.has(datasetId)) {
                datasetId = `${datasetId}-${datasets.length}`;
              }
              seenIds.add(datasetId);

              const originalName =
                (typeof meta.name === "string" && meta.name.trim()) ||
                (isObject &&
                  typeof datasetRecord?.name === "string" &&
                  (datasetRecord.name as string).trim()) ||
                (isObject &&
                  typeof datasetRecord?.table_name === "string" &&
                  (datasetRecord.table_name as string).trim()) ||
                undefined;

              const datasetDescription =
                (typeof meta.description === "string" && meta.description.trim()) ||
                (isObject &&
                  typeof datasetRecord?.description === "string" &&
                  (datasetRecord.description as string).trim()) ||
                undefined;

              const rawTableNames = extractDatasetTableNames(rawDataset, {
                description: datasetDescription ?? null,
              });
              const tableNames: string[] = [];
              const seenTableNames = new Set<string>();
              rawTableNames.forEach((tableName) => {
                const resolved = resolveDatasetLabel(tableName);
                const key = normalizeDatasetLabel(resolved);
                if (key && !seenTableNames.has(key)) {
                  seenTableNames.add(key);
                  tableNames.push(resolved);
                }
              });

              const resolvedName = tableNames[0] ?? resolveDatasetLabel(originalName);
              const normalizedLabel = normalizeDatasetLabel(resolvedName);
              if (normalizedLabel && seenLabels.has(normalizedLabel)) {
                return;
              }
              if (normalizedLabel) {
                seenLabels.add(normalizedLabel);
              }

              datasets.push({
                id: datasetId,
                name: resolvedName,
                description: datasetDescription,
                preview,
                tableNames,
                originalName: originalName ?? undefined,
              });
            };

            if (questionDataset) {
              pushDataset(questionDataset, {
                id: questionDataset.id,
                name: questionDataset.name,
                description: questionDataset.description,
              });
            }

            const inlineDataset =
              selectedQuestionForPopup &&
              typeof (selectedQuestionForPopup as any)?.dataset === "object" &&
              !Array.isArray((selectedQuestionForPopup as any)?.dataset)
                ? (selectedQuestionForPopup as any).dataset
                : null;

            if (inlineDataset) {
              pushDataset(inlineDataset, {
                id: inlineDataset?.id,
                name: inlineDataset?.name ?? selectedQuestionForPopup?.exerciseTitle ?? null,
                description: inlineDataset?.description,
              });
            }

            exerciseDatasetList.forEach((dataset: any, index: number) => {
              pushDataset(dataset, {
                id:
                  typeof dataset?.id === "string" || typeof dataset?.id === "number"
                    ? String(dataset.id)
                    : `exercise-${index}`,
                name: dataset?.name,
                description: dataset?.description,
              });
            });

            return datasets;
          })()
        : [],
    [exerciseDatasetList, isSpreadsheetQuestion, questionDataset, selectedQuestionForPopup],
  );

  const duckDbDatasets = useMemo(() => {
    if (!shouldUseDuckDb) {
      return [];
    }

    const datasets: SqlDatasetDefinition[] = [];
    const seen = new Set<string>();

    const pushDataset = (dataset: SqlDatasetDefinition) => {
      if (!dataset) return;
      const rawSchemaInfo =
        (dataset as Record<string, unknown>)?.schema_info &&
        typeof (dataset as Record<string, unknown>)?.schema_info === "object"
          ? ((dataset as Record<string, unknown>).schema_info as QuestionDatasetSchemaInfo)
          : undefined;
      const creationSource = coalesceString(
        dataset.creation_sql,
        dataset.create_sql,
        rawSchemaInfo?.create_sql,
        rawSchemaInfo?.creation_sql,
        (dataset as Record<string, unknown>)["data_creation_sql"],
      );
      const normalizedCreationSql = normalizeCreationSql(creationSource);
      const inferredTableName = dataset.table_name ?? inferTableNameFromSql(normalizedCreationSql);
      const creationTables = extractTableNamesFromSql(normalizedCreationSql);
      const combinedCreationTables = Array.from(
        new Set(
          [
            ...(Array.isArray(dataset.creationTables) ? dataset.creationTables : []),
            ...creationTables,
          ].filter(
            (table): table is string =>
              typeof table === "string" && table.trim().length > 0,
          ),
        ),
      );
      const datasetKey = deriveDatasetKey({
        id: dataset.id,
        table_name: inferredTableName,
        creation_sql: normalizedCreationSql,
        create_sql: normalizedCreationSql ?? undefined,
      });
      const normalizedDataset: SqlDatasetDefinition = {
        ...dataset,
        creation_sql: normalizedCreationSql,
        create_sql: normalizedCreationSql ?? undefined,
        table_name: inferredTableName ?? dataset.table_name,
        cacheKey: datasetKey,
        creationTables: combinedCreationTables.length > 0 ? combinedCreationTables : undefined,
      };
      const key =
        datasetKey ||
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

    exerciseDatasetList.forEach((dataset: any, index: number) => {
      const creationSqlSource = coalesceString(
        dataset?.creation_sql,
        dataset?.create_sql,
        dataset?.sql,
        dataset?.data,
        dataset?.schema_info?.create_sql,
        dataset?.schema_info?.creation_sql,
      );
      pushDataset({
        id: `exercise-${activeExercise?.id ?? "exercise"}-${dataset.id ?? index}`,
        name: dataset.name || `Dataset ${index + 1}`,
        description: dataset.description,
        placeholders: dataset.placeholders || dataset.columns,
        creation_sql: creationSqlSource,
        create_sql: creationSqlSource ?? undefined,
        table_name: dataset.table_name,
        data: dataset.data,
        columns: dataset.columns,
      });
    });

    if (activeExercise?.dataset && typeof activeExercise.dataset === "string") {
      const creationSqlSource = coalesceString(activeExercise.data, activeExercise.dataset);
      pushDataset({
        id: `active-exercise-dataset:${activeExercise.id}`,
        name: activeExercise.title || "Exercise Dataset",
        description: "Dataset provided at exercise level",
        creation_sql: creationSqlSource,
        create_sql: creationSqlSource ?? undefined,
      });
    }

    if (currentExerciseData?.context?.data_creation_sql || currentExerciseData?.context?.create_sql) {
      const creationSqlSource = coalesceString(
        currentExerciseData.context?.data_creation_sql,
        currentExerciseData.context?.create_sql,
      );
      pushDataset({
        id: `exercise-context:${currentExerciseData.exercise?.id ?? "context"}`,
        name: currentExerciseData.exercise?.title || "Generated Dataset",
        description: currentExerciseData.context?.dataset_description,
        placeholders: Array.isArray(currentExerciseData.context?.expected_cols_list)
          ? currentExerciseData.context.expected_cols_list.flat()
          : undefined,
        creation_sql: creationSqlSource,
        create_sql: creationSqlSource ?? undefined,
        dataset_csv_raw: currentExerciseData.context.dataset_csv_raw,
        columns: currentExerciseData.context.dataset_columns,
      });
    }

    const questionExerciseDataset = (selectedQuestionForPopup as any)?.exerciseDataset;
    if (typeof questionExerciseDataset === "string" && questionExerciseDataset.trim()) {
      pushDataset({
        id: `question-exercise:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: selectedQuestionForPopup?.exerciseTitle || "Exercise Dataset",
        description: "Exercise-level dataset",
        creation_sql: questionExerciseDataset,
        create_sql: questionExerciseDataset,
        dataset_csv_raw: extractCsvFromSource(questionExerciseDataset),
      });
    }

    const inlineQuestionDataset = (selectedQuestionForPopup as any)?.dataset;
    if (typeof inlineQuestionDataset === "string" && inlineQuestionDataset.trim()) {
      pushDataset({
        id: `question-inline:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: selectedQuestionForPopup?.exerciseTitle || "Question Dataset",
        description: "Dataset attached to question",
        creation_sql: inlineQuestionDataset,
        create_sql: inlineQuestionDataset,
        dataset_csv_raw: extractCsvFromSource(inlineQuestionDataset),
      });
    } else if (inlineQuestionDataset && typeof inlineQuestionDataset === "object") {
      const inlineCreationSource = coalesceString(
        inlineQuestionDataset.creation_sql,
        inlineQuestionDataset.create_sql,
        inlineQuestionDataset.sql,
        inlineQuestionDataset.dataset,
      );
      pushDataset({
        id: `question-inline:${selectedQuestionForPopup?.id ?? "inline"}`,
        name: inlineQuestionDataset.name || selectedQuestionForPopup?.exerciseTitle || "Question Dataset",
        description: inlineQuestionDataset.description,
        creation_sql: inlineCreationSource,
        create_sql: inlineCreationSource ?? undefined,
        table_name: inlineQuestionDataset.table_name,
        data: inlineQuestionDataset.data,
        columns: inlineQuestionDataset.columns,
        dataset_csv_raw:
          typeof inlineQuestionDataset.dataset_csv_raw === "string"
            ? extractCsvFromSource(inlineQuestionDataset.dataset_csv_raw) ?? inlineQuestionDataset.dataset_csv_raw
            : undefined,
        placeholders: inlineQuestionDataset.placeholders,
      });
    }

    if (questionDataset) {
      const questionCreationSource = coalesceString(
        questionDataset?.schema_info?.creation_sql,
        questionDataset?.schema_info?.create_sql,
        questionDataset?.creation_sql,
        questionDataset?.create_sql,
      );
      pushDataset({
        id: `question-dataset:${questionDataset.id ?? "inline"}`,
        name: questionDataset.name || "Question Dataset",
        description: questionDataset.description || "Generated dataset for this question",
        placeholders: questionDataset.columns || questionDataset.placeholders,
        creation_sql: questionCreationSource,
        create_sql: questionCreationSource ?? undefined,
        table_name: questionDataset.table_name,
        data: questionDataset.data,
        columns: questionDataset.columns,
      });
    }

    return datasets;
  }, [
    shouldUseDuckDb,
    questionDataset,
    selectedQuestionForPopup,
    currentExerciseData,
    activeExercise,
    exerciseDatasetList,
  ]);

  const activeSpreadsheetDataset =
    isSpreadsheetQuestion && activeDatasetId
      ? spreadsheetDatasets.find((dataset) => dataset.id === activeDatasetId) ?? null
      : null;

  const availablePythonDatasets = useMemo(() => {
    if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
      return [] as PythonDatasetDefinition[];
    }

    const datasets: PythonDatasetDefinition[] = [];
    const seen = new Set<string>();

    const pushDataset = (candidate?: PythonDatasetDefinition | null) => {
      if (!candidate) return;
      const key = [
        typeof candidate.source === "string" ? candidate.source.trim() : undefined,
        typeof candidate.id === "string" ? candidate.id.trim() : candidate.id,
        typeof candidate.table_name === "string" ? candidate.table_name.trim() : undefined,
        typeof candidate.name === "string" ? candidate.name.trim() : undefined,
      ]
        .filter(
          (part): part is string | number =>
            typeof part === "number" ||
            (typeof part === "string" && part.length > 0),
        )
        .join("::");

      if (key && seen.has(key)) {
        return;
      }
      if (key) {
        seen.add(key);
      }
      datasets.push(candidate);
    };

    if (questionDataset) {
      pushDataset({
        id: `question-python:${questionDataset.id ?? "inline"}`,
        name: questionDataset.name || "Question Dataset",
        description: questionDataset.description,
        data: questionDataset.data,
        columns: questionDataset.columns,
        dataset_csv_raw: questionDataset.dataset_csv_raw,
        schema_info: questionDataset.schema_info,
        table_name: questionDataset.table_name,
        source: "question",
        creation_sql:
          typeof questionDataset?.schema_info?.creation_sql === "string"
            ? questionDataset.schema_info.creation_sql
            : typeof questionDataset?.creation_sql === "string"
            ? questionDataset.creation_sql
            : undefined,
        creation_python: coalesceString(
          questionDataset?.schema_info?.creation_python,
          questionDataset?.schema_info?.create_python,
          questionDataset?.creation_python,
          questionDataset?.create_python,
          (questionDataset as Record<string, unknown> | null | undefined)?.data_creation_python,
        ),
        create_python: coalesceString(
          questionDataset?.schema_info?.create_python,
          questionDataset?.schema_info?.creation_python,
          questionDataset?.create_python,
          questionDataset?.creation_python,
          (questionDataset as Record<string, unknown> | null | undefined)?.data_creation_python,
        ),
      });
    }

    const inlineDataset = (selectedQuestionForPopup as any)?.dataset;
    if (inlineDataset && typeof inlineDataset === "object" && !Array.isArray(inlineDataset)) {
      const inlineCreationSource = coalesceString(
        inlineDataset.creation_sql,
        inlineDataset.create_sql,
        inlineDataset.sql,
        inlineDataset.data,
        inlineDataset?.schema_info?.create_sql,
        inlineDataset?.schema_info?.creation_sql,
      );
      const inlineCreationPython = coalesceString(
        inlineDataset.create_python,
        inlineDataset.creation_python,
        inlineDataset?.schema_info?.create_python,
        inlineDataset?.schema_info?.creation_python,
        inlineDataset?.schema_info?.data_creation_python,
        inlineDataset?.data_creation_python,
      );
      pushDataset({
        id: `question-inline-python:${selectedQuestionForPopup?.id ?? "inline"}`,
        name:
          inlineDataset.name ||
          selectedQuestionForPopup?.exerciseTitle ||
          "Question Dataset",
        description: inlineDataset.description,
        data: Array.isArray(inlineDataset.data) ? inlineDataset.data : undefined,
        columns: Array.isArray(inlineDataset.columns)
          ? inlineDataset.columns
          : undefined,
        dataset_csv_raw:
          typeof inlineDataset.dataset_csv_raw === "string"
            ? inlineDataset.dataset_csv_raw
            : undefined,
        schema_info: inlineDataset.schema_info,
        table_name: inlineDataset.table_name,
        source: "question-inline",
        creation_sql: inlineCreationSource,
        create_sql: inlineCreationSource ?? undefined,
        creation_python: inlineCreationPython,
        create_python: inlineCreationPython ?? undefined,
      });
    }

    exerciseDatasetList.forEach((dataset: any, index: number) => {
      const rawSubject =
        typeof dataset?.subject_type === "string"
          ? dataset.subject_type.toLowerCase()
          : undefined;
      if (
        rawSubject &&
        rawSubject !== "python" &&
        rawSubject !== "statistics"
      ) {
        return;
      }
      const datasetCreationPython = coalesceString(
        dataset.create_python,
        dataset.creation_python,
        dataset?.schema_info?.create_python,
        dataset?.schema_info?.creation_python,
        dataset?.schema_info?.data_creation_python,
        dataset?.data_creation_python,
      );
      pushDataset({
        id: `exercise-python:${dataset.id ?? index}`,
        name: dataset.name || `Dataset ${index + 1}`,
        description: dataset.description,
        data: Array.isArray(dataset.data) ? dataset.data : undefined,
        columns: Array.isArray(dataset.columns) ? dataset.columns : undefined,
        dataset_csv_raw:
          typeof dataset.dataset_csv_raw === "string"
            ? dataset.dataset_csv_raw
            : undefined,
        schema_info: dataset.schema_info,
        table_name: dataset.table_name,
        source: "exercise",
        creation_sql: coalesceString(
          dataset.creation_sql,
          dataset.create_sql,
          dataset.sql,
          dataset.data,
          dataset?.schema_info?.create_sql,
          dataset?.schema_info?.creation_sql,
        ),
        create_sql: coalesceString(
          dataset.create_sql,
          dataset.creation_sql,
          dataset?.schema_info?.create_sql,
          dataset?.schema_info?.creation_sql,
        ),
        creation_python: datasetCreationPython,
        create_python: datasetCreationPython ?? undefined,
      });
    });

    return datasets;
  }, [isPythonLikeQuestion, questionDataset, selectedQuestionForPopup, exerciseDatasetList]);

 

  const duckDbDatasetVariants = useMemo<SqlDatasetVariant[]>(() => {
    if (!shouldUseDuckDb) {
      return [];
    }

    const variants = duckDbDatasets.flatMap((dataset) => {
      const datasetKey =
        dataset.cacheKey ??
        deriveDatasetKey({
          id: dataset.id,
          table_name: dataset.table_name,
          creation_sql: dataset.creation_sql,
        });

      const mappedTables = datasetKey ? duckDbDatasetTables[datasetKey] : undefined;
      const creationTables = Array.isArray(dataset.creationTables) ? dataset.creationTables : [];
      const fallbackTables =
        typeof dataset.table_name === "string" && dataset.table_name.trim().length > 0
          ? [dataset.table_name]
          : [];
      const candidateTables = Array.from(
        new Set(
          [
            ...(Array.isArray(mappedTables) ? mappedTables : []),
            ...fallbackTables,
            ...creationTables,
          ].filter(
            (value): value is string => typeof value === "string" && value.trim().length > 0,
          ),
        ),
      );

      if (candidateTables.length === 0) {
        const displayLabel = resolveDatasetLabel(dataset.name || dataset.table_name || "Dataset");
        return [
          {
            ...dataset,
            id: dataset.id,
            baseDatasetId: dataset.id,
            displayName: displayLabel,
            resolvedTableName: dataset.table_name,
          },
        ];
      }

      const baseName = dataset.name || dataset.table_name || "Dataset";
      const hasMultipleTables = candidateTables.length > 1;

      return candidateTables.map<SqlDatasetVariant>((tableName) => {
        const rawLabel = hasMultipleTables ? tableName : baseName;
        const displayLabel = resolveDatasetLabel(rawLabel);
        return {
          ...dataset,
          id: `${dataset.id}::${tableName}`,
          baseDatasetId: dataset.id,
          displayName: displayLabel,
          resolvedTableName: tableName,
        };
      });
    });

    return dedupeByLabel(variants, (variant) =>
      resolveDatasetLabel(
        variant.displayName ??
          variant.resolvedTableName ??
          variant.table_name ??
          variant.name,
        "Dataset",
      ),
    );
  }, [duckDbDatasets, duckDbDatasetTables, shouldUseDuckDb]);

  const pythonDatasetDetails = useMemo(() => {
    if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
      return {} as Record<string, PythonDatasetDetail>;
    }

    const detailMap: Record<string, PythonDatasetDetail> = {};
    availablePythonDatasets.forEach((dataset, index) => {
      detailMap[dataset.id] = buildPythonDatasetDetail(dataset, index);
    });
    return detailMap;
  }, [availablePythonDatasets, isPythonLikeQuestion]);

  useEffect(() => {
    const variantKey =
      shouldUseDuckDb && duckDbDatasetVariants.length > 0
        ? duckDbDatasetVariants.map((dataset) => dataset.id).join("|")
        : "";
    const pythonKey =
      isPythonLikeQuestion && availablePythonDatasets.length > 0
        ? availablePythonDatasets.map((dataset) => dataset.id).join("|")
        : "";
    const signature = [
      datasetCacheScopeKey,
      selectedQuestionType ?? "unknown",
      String(shouldUseDuckDb),
      variantKey,
      pythonKey,
      String(isSpreadsheetQuestion),
      String(isPythonLikeQuestion),
    ].join(";");

    if (datasetAvailabilitySignatureRef.current === signature) {
      return;
    }
    datasetAvailabilitySignatureRef.current = signature;

    if (selectedQuestionType === "google_sheets") {
      return;
    }

    let nextActiveId: string | null = activeDatasetId;
    let shouldResetPreview = false;

    if (shouldUseDuckDb) {
      if (duckDbDatasetVariants.length > 0) {
        const currentMatches =
          nextActiveId && duckDbDatasetVariants.some((dataset) => dataset.id === nextActiveId);
        if (!currentMatches) {
          nextActiveId = duckDbDatasetVariants[0]?.id ?? null;
          shouldResetPreview = true;
        }
      } else if (isPythonLikeQuestion && availablePythonDatasets.length > 0) {
        const currentMatches =
          nextActiveId && availablePythonDatasets.some((dataset) => dataset.id === nextActiveId);
        if (!currentMatches) {
          nextActiveId = availablePythonDatasets[0]?.id ?? null;
          shouldResetPreview = true;
        }
      } else {
        if (nextActiveId !== null) {
          shouldResetPreview = true;
        }
        nextActiveId = null;
      }
    } else if (!isSpreadsheetQuestion) {
      if (nextActiveId !== null) {
        shouldResetPreview = true;
      }
      nextActiveId = null;
    }

    if (nextActiveId !== activeDatasetId) {
      setActiveDatasetId(nextActiveId);
    }

    if (shouldResetPreview) {
      setDatasetPreview(null);
      setDatasetPreviewError(null);
    }
  }, [
    activeDatasetId,
    availablePythonDatasets,
    duckDbDatasetVariants,
    isPythonLikeQuestion,
    isSpreadsheetQuestion,
    selectedQuestionType,
    shouldUseDuckDb,
    datasetCacheScopeKey,
  ]);

  const loadDatasetPreview = useCallback(
    async (datasetId: string | null) => {
      if (selectedQuestionType === "google_sheets") {
        setLoadingDatasetPreview(false);
        return;
      }

      if (!datasetId) {
        setDatasetPreview(null);
        setDatasetPreviewError(null);
        setLoadingDatasetPreview(false);
        activeDatasetPreviewRequestRef.current = null;
        return;
      }

      const variant = duckDbDatasetVariants.find((dataset) => dataset.id === datasetId);
      const baseDatasetId = variant?.baseDatasetId ?? datasetId;
      const baseDataset =
        duckDbDatasets.find((dataset) => dataset.id === baseDatasetId) ?? variant ?? null;
      const pythonDetail =
        isPythonLikeQuestion && baseDatasetId
          ? pythonDatasetDetails[baseDatasetId]
          : undefined;

      const scopeKey = datasetCacheScopeKey;
      if (!datasetPreviewCacheRef.current[scopeKey]) {
        datasetPreviewCacheRef.current[scopeKey] = {};
      }
      const scopeCache = datasetPreviewCacheRef.current[scopeKey];

      const datasetCacheKey =
        variant?.cacheKey ??
        baseDataset?.cacheKey ??
        deriveDatasetKey({
          id: baseDatasetId ?? baseDataset?.id ?? variant?.id ?? datasetId,
          table_name: variant?.resolvedTableName ?? baseDataset?.table_name ?? variant?.table_name,
          creation_sql: baseDataset?.creation_sql ?? variant?.creation_sql,
        });

      const tableKey =
        variant?.resolvedTableName ??
        baseDataset?.table_name ??
        (Array.isArray(pythonDetail?.tableNames) && pythonDetail.tableNames.length > 0
          ? pythonDetail.tableNames[0]
          : null);
      const cacheKeyBase = String(datasetCacheKey ?? baseDatasetId ?? datasetId);
      const cacheKey = tableKey ? `${cacheKeyBase}::${tableKey}` : cacheKeyBase;
      const requestToken = `${scopeKey}::${cacheKey}`;

      const cachedPreview = scopeCache?.[cacheKey];
      if (cachedPreview) {
        activeDatasetPreviewRequestRef.current = requestToken;
        setDatasetPreview(cachedPreview);
        setDatasetPreviewError(null);
        setLoadingDatasetPreview(false);
        return;
      }

      setLoadingDatasetPreview(true);
      activeDatasetPreviewRequestRef.current = requestToken;

      const finalize = (
        preview: DatasetPreview | null,
        error: string | null,
        options: { cache?: boolean } = {},
      ) => {
        if (activeDatasetPreviewRequestRef.current !== requestToken) {
          return;
        }

        setDatasetPreview(preview);
        setDatasetPreviewError(error);
        setLoadingDatasetPreview(false);

        if (preview && options.cache !== false) {
          datasetPreviewCacheRef.current[scopeKey] = {
            ...datasetPreviewCacheRef.current[scopeKey],
            [cacheKey]: preview,
          };
        }
      };

      const normalizeRowValues = (row: unknown, columns: string[]): unknown[] => {
        if (Array.isArray(row)) {
          return columns.map((_, index) => row[index] ?? null);
        }
        if (row && typeof row === "object") {
          return columns.map((columnName) => {
            const typedRow = row as Record<string, unknown>;
            if (columnName in typedRow) {
              return typedRow[columnName];
            }
            return null;
          });
        }
        return columns.map(() => row ?? null);
      };

      const fallbackToPythonDetail = () => {
        if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
          finalize(null, "Preview data is not available for this dataset yet.", { cache: false });
          return;
        }

        if (!pythonDetail) {
          finalize(null, "Dataset preview is not available.", { cache: false });
          return;
        }

        if (pythonDetail.previewRows.length > 0 && pythonDetail.columns.length > 0) {
          finalize(
            {
              columns: pythonDetail.columns,
              rows: pythonDetail.previewRows,
            },
            null,
          );
        } else {
          finalize(
            null,
            pythonDetail.loadError ?? "Preview data is not available for this dataset yet.",
            { cache: false },
          );
        }
      };

      if (shouldUseDuckDb && baseDataset) {
        try {
          const datasetKey =
            variant?.cacheKey ??
            baseDataset.cacheKey ??
            deriveDatasetKey({
              id: baseDatasetId ?? baseDataset.id,
              table_name: variant?.resolvedTableName ?? baseDataset.table_name,
              creation_sql: baseDataset.creation_sql,
            });

          const mappedTables = datasetKey ? duckDbDatasetTables[datasetKey] : undefined;
          const preferredTableNames = Array.from(
            new Set(
              [
                variant?.resolvedTableName,
                ...(Array.isArray(mappedTables) ? mappedTables : []),
                baseDataset.table_name,
              ].filter(
                (value): value is string => typeof value === "string" && value.trim().length > 0,
              ),
            ),
          );
          const mappedTableName = preferredTableNames.find((tableName) =>
            duckDbTables.includes(tableName),
          );

          if (
            mappedTableName &&
            duckDbTables.includes(mappedTableName) &&
            isDuckDbReady &&
            !isDuckDbLoading &&
            !isPreparingDuckDb
          ) {
            const escapeIdentifier = (value: string) => value.replace(/"/g, '""');
            const previewQuery = `SELECT * FROM "${escapeIdentifier(String(mappedTableName))}" LIMIT 20;`;
            const result = await executeDuckDbQuery(previewQuery);
            if (result.success && result.result) {
              finalize(
                {
                  columns: result.result.columns ?? [],
                  rows: (result.result.rows ?? []).map((row) =>
                    Array.isArray(row) ? row : [row],
                  ),
                },
                null,
              );
              return;
            }
          }

          const fallbackData = Array.isArray(variant?.data)
            ? variant!.data
            : Array.isArray(baseDataset.data)
            ? baseDataset.data
            : [];

          if (fallbackData.length > 0) {
            let columns = Array.isArray(variant?.columns)
              ? variant!.columns
              : Array.isArray(baseDataset.columns)
              ? baseDataset.columns
              : [];
            if (!columns.length) {
              const firstRow = fallbackData[0];
              if (firstRow && typeof firstRow === "object" && !Array.isArray(firstRow)) {
                columns = Object.keys(firstRow);
              }
            }

            if (!columns.length && Array.isArray(fallbackData[0])) {
              columns = (fallbackData[0] as unknown[]).map((_, index) => `column_${index + 1}`);
            }

            if (columns.length) {
              finalize(
                {
                  columns,
                  rows: fallbackData.slice(0, 20).map((row) => normalizeRowValues(row, columns)),
                },
                null,
              );
              return;
            }
          }

          if (isPythonLikeQuestion) {
            fallbackToPythonDetail();
            return;
          }

          finalize(null, "Preview data is not available for this dataset yet.", { cache: false });
        } catch (error) {
          console.error("Failed to load dataset preview:", error);
          if (isPythonLikeQuestion) {
            fallbackToPythonDetail();
          } else {
            finalize(
              null,
              error instanceof Error ? error.message : "Unable to load dataset preview.",
              { cache: false },
            );
          }
        }
        return;
      }

      if (isPythonLikeQuestion) {
        fallbackToPythonDetail();
        return;
      }

      finalize(null, null, { cache: false });
    },
    [
      duckDbDatasetVariants,
      duckDbDatasets,
      pythonDatasetDetails,
      duckDbDatasetTables,
      duckDbTables,
      executeDuckDbQuery,
      isDuckDbLoading,
      isDuckDbReady,
      isPreparingDuckDb,
      isPythonLikeQuestion,
      selectedQuestionType,
      shouldUseDuckDb,
      datasetCacheScopeKey,
    ],
  );

  useEffect(() => {
    loadDatasetPreview(activeDatasetId);
  }, [activeDatasetId, loadDatasetPreview]);

  useEffect(() => {
    if (!isSpreadsheetQuestion) {
      return;
    }

    if (!spreadsheetDatasets.length) {
      if (activeDatasetId !== null) {
        setActiveDatasetId(null);
      }
      setLoadingDatasetPreview(false);
      setDatasetPreview(null);
      setDatasetPreviewError("Dataset preview is not available yet.");
      return;
    }

    let currentDataset =
      activeDatasetId !== null
        ? spreadsheetDatasets.find((dataset) => dataset.id === activeDatasetId)
        : undefined;

    if (!currentDataset) {
      const fallbackDataset = spreadsheetDatasets[0];
      if (activeDatasetId !== fallbackDataset.id) {
        setActiveDatasetId(fallbackDataset.id);
        return;
      }
      currentDataset = fallbackDataset;
    }

    setLoadingDatasetPreview(false);
    setDatasetPreview(currentDataset.preview);
    setDatasetPreviewError(
      currentDataset.preview ? null : "Dataset preview is not available yet.",
    );
  }, [activeDatasetId, isSpreadsheetQuestion, spreadsheetDatasets]);

  useEffect(() => {
    if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
      if (Object.keys(pythonDatasetStatus).length > 0) {
        setPythonDatasetStatus({});
      }
      return;
    }

    if (availablePythonDatasets.length === 0) {
      if (Object.keys(pythonDatasetStatus).length > 0) {
        setPythonDatasetStatus({});
      }
      return;
    }

    setPythonDatasetStatus((prev) => {
      const allowedIds = new Set(availablePythonDatasets.map((dataset) => dataset.id));
      const next: Record<string, PythonDatasetLoadState> = {};
      let changed = false;

      allowedIds.forEach((id) => {
        if (prev[id]) {
          next[id] = prev[id];
        } else {
          changed = true;
        }
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

    return changed ? next : prev;
  });
  }, [availablePythonDatasets, pythonDatasetStatus, isPythonLikeQuestion]);

  useEffect(() => {
    if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
      return;
    }
    if (!isPyodideReady) {
      return;
    }
    if (availablePythonDatasets.length === 0) {
      return;
    }

    let cancelled = false;

    const loadDatasetsIntoPyodide = async () => {
      for (const dataset of availablePythonDatasets) {
        const detail = pythonDatasetDetails[dataset.id];
        if (!detail) {
          continue;
        }

        if (!detail.objectRows.length) {
          setPythonDatasetStatus((prev) => {
            const current = prev[dataset.id];
            const nextState: PythonDatasetLoadState = {
              state: "failed",
              message: detail.loadError ?? "Dataset has no rows available to load.",
              variable: detail.pythonVariable,
            };
            if (
              current &&
              current.state === nextState.state &&
              current.message === nextState.message &&
              current.variable === nextState.variable
            ) {
              return prev;
            }
            return {
              ...prev,
              [dataset.id]: nextState,
            };
          });
          continue;
        }

        setPythonDatasetStatus((prev) => {
          const current = prev[dataset.id];
          if (current?.state === "loaded" || current?.state === "loading") {
            return prev;
          }
          return {
            ...prev,
            [dataset.id]: { state: "loading", variable: detail.pythonVariable },
          };
        });

        try {
          const loaded = await loadPyodideDataFrame(detail.pythonVariable, detail.objectRows);
          if (cancelled) {
            return;
          }
          setPythonDatasetStatus((prev) => ({
            ...prev,
            [dataset.id]: loaded
              ? { state: "loaded", variable: detail.pythonVariable }
              : {
                  state: "failed",
                  variable: detail.pythonVariable,
                  message: "Failed to load dataset into Python runtime.",
                },
          }));
        } catch (error) {
          if (cancelled) {
            return;
          }
          setPythonDatasetStatus((prev) => ({
            ...prev,
            [dataset.id]: {
              state: "failed",
              variable: detail.pythonVariable,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to load dataset into Python runtime.",
            },
          }));
        }
      }
    };

    loadDatasetsIntoPyodide();

    return () => {
      cancelled = true;
    };
  }, [
    availablePythonDatasets,
    isPyodideReady,
    loadPyodideDataFrame,
    pythonDatasetDetails,
    isPythonLikeQuestion,
  ]);

  const activePythonVariant =
    isPythonLikeQuestion && activeDatasetId  || (selectedQuestionType === "statistics" && activeDatasetId)
      ? duckDbDatasetVariants.find((dataset) => dataset.id === activeDatasetId)
      : undefined;
  const activePythonBaseDatasetId =
    isPythonLikeQuestion && activeDatasetId && activeDatasetId  || (selectedQuestionType === "statistics" && activeDatasetId)
      ? activePythonVariant?.baseDatasetId ?? activeDatasetId
      : null;

   // --- Python starter from datasets (practice_datasets + question + exercise) ---
  const pythonStarterFromDatasets = useMemo(() => {
    if (!(selectedQuestionType === "python" || selectedQuestionType === "statistics")) {
      return undefined;
    }

    const resolvePythonCreationSource = (candidate: unknown): string | undefined => {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
      const record = candidate as Record<string, unknown>;
      const schemaInfoRaw = record["schema_info"];
      const schemaInfo =
        schemaInfoRaw && typeof schemaInfoRaw === "object" && !Array.isArray(schemaInfoRaw)
          ? (schemaInfoRaw as Record<string, unknown>)
          : undefined;

      // Coalesce all the usual fields we already support elsewhere
      return coalesceString(
        typeof record["create_python"] === "string" ? (record["create_python"] as string) : undefined,
        typeof record["creation_python"] === "string" ? (record["creation_python"] as string) : undefined,
        schemaInfo && typeof schemaInfo["create_python"] === "string" ? (schemaInfo["create_python"] as string) : undefined,
        schemaInfo && typeof schemaInfo["creation_python"] === "string" ? (schemaInfo["creation_python"] as string) : undefined,
        schemaInfo && typeof schemaInfo["data_creation_python"] === "string" ? (schemaInfo["data_creation_python"] as string) : undefined,
        typeof record["data_creation_python"] === "string" ? (record["data_creation_python"] as string) : undefined,
      );
    };

    const normalize = (src?: string) =>
      src ? normalizeCreationSql(src, { datasetType: "python", preserveFormatting: true }) : undefined;

    // Prioritize the currently active/python base dataset, then all available python datasets
    const candidates: any[] = [];
    const activeDef = activePythonBaseDatasetId
      ? availablePythonDatasets.find(d => d.id === activePythonBaseDatasetId)
      : undefined;
    if (activeDef) candidates.push(activeDef);
    candidates.push(...availablePythonDatasets);

    // Also consider any practice_datasets attached to the selected question/exercise
    const practice = (selectedQuestionForPopup as any)?.practice_datasets;
    if (Array.isArray(practice)) candidates.push(...practice);

    for (const c of candidates) {
      const s = normalize(resolvePythonCreationSource(c));
      if (s) return s;
    }

    // Fallbacks: question-level dataset, inline dataset, raw question object
    const fb = normalize(resolvePythonCreationSource(questionDataset)) ??
              normalize(resolvePythonCreationSource((selectedQuestionForPopup as any)?.dataset)) ??
              normalize(resolvePythonCreationSource(selectedQuestionForPopup));

    return fb ?? undefined;
  }, [
    selectedQuestionType,
    availablePythonDatasets,
    activePythonBaseDatasetId,
    selectedQuestionForPopup,
    questionDataset,
  ]);


  const activePythonDatasetDetail =
    isPythonLikeQuestion  && activePythonBaseDatasetId && activePythonBaseDatasetId || (selectedQuestionType === "statistics" && activePythonBaseDatasetId)
      ? pythonDatasetDetails[activePythonBaseDatasetId]
      : undefined;

  const activePythonDatasetStatus =
    isPythonLikeQuestion && activePythonBaseDatasetId && activePythonBaseDatasetId || (selectedQuestionType === "statistics" && activePythonBaseDatasetId)
      ? pythonDatasetStatus[activePythonBaseDatasetId]
      : undefined;

  const pythonDatasetOptions = useMemo(() => {
    if (!isPythonLikeQuestion && selectedQuestionType !== "statistics") {
      return [] as Array<{
        id: string;
        label: string;
        baseDatasetId: string;
        tableName?: string;
        tableNames?: string[];
        originalName?: string;
      }>;
    }

    if (duckDbDatasetVariants.length > 0) {
      const options = duckDbDatasetVariants.map((variant) => {
        const rawLabel =
          variant.resolvedTableName ||
          variant.displayName ||
          variant.table_name ||
          variant.name ||
          "dataset";
        const label = resolveDatasetLabel(rawLabel);
        return {
          id: variant.id,
          label,
          baseDatasetId: variant.baseDatasetId,
          tableName: variant.resolvedTableName ?? variant.table_name,
          tableNames: variant.resolvedTableName
            ? [resolveDatasetLabel(variant.resolvedTableName)]
            : variant.table_name
            ? [resolveDatasetLabel(variant.table_name)]
            : undefined,
          originalName: variant.name,
        };
      });
      return dedupeByLabel(options, (option) => option.label);
    }

    const options = availablePythonDatasets.map((dataset) => {
      const detail = pythonDatasetDetails[dataset.id];
      const rawLabel =
        detail?.tableNames?.[0] ||
        detail?.pythonVariable ||
        detail?.displayName ||
        detail?.name ||
        dataset.table_name ||
        dataset.name ||
        "dataset";
      const label = resolveDatasetLabel(rawLabel);
      return {
        id: dataset.id,
        label,
        baseDatasetId: dataset.id,
        tableName: detail?.tableNames?.[0] ?? dataset.table_name,
        tableNames: detail?.tableNames?.length
          ? detail.tableNames
          : dataset.table_name
          ? [resolveDatasetLabel(dataset.table_name)]
          : undefined,
        originalName: detail?.originalName ?? dataset.name,
      };
    });
    return dedupeByLabel(options, (option) => option.label);
  }, [
    availablePythonDatasets,
    duckDbDatasetVariants,
    isPythonLikeQuestion,
    pythonDatasetDetails,
    selectedQuestionType,
  ]);

  const datasetLoadSignature = useMemo(
    () =>
      JSON.stringify(
        duckDbDatasets.map((dataset) => ({
          id: dataset.id,
          creation: dataset.creation_sql,
          table: dataset.table_name,
          rows: Array.isArray(dataset.data) ? dataset.data.length : 0,
        })),
      ),
    [duckDbDatasets],
  );

  // useEffect(() => {
  //   if (!selectedQuestionForPopup) {
  //     setSqlCode('');
  //     setSqlResults([]);
  //     setDuckDbTables([]);
  //     setDuckDbSetupError(null);
  //   }
  // }, [selectedQuestionForPopup]);

  useEffect(() => {
    if (!selectedQuestionForPopup) {
      setSqlCode('');
      setPythonCode('');
      setSqlResults([]);
      setDuckDbTables([]);
      setDuckDbSetupError(null);
      return;
    }

    const questionType = (selectedQuestionForPopup.question_type || selectedQuestionForPopup.type || "sql").toLowerCase();
    setCodeLanguage(questionType);

  }, [selectedQuestionForPopup?.id, selectedQuestionForPopup?.question_type, selectedQuestionForPopup?.type]);

  useEffect(() => {
    if (!selectedQuestionForPopup) {
      return;
    }

    const questionKey = (() => {
      if (!selectedQuestionForPopup) {
        return undefined;
      }
      const rawId = (selectedQuestionForPopup as { id?: unknown }).id;
      if (typeof rawId === "string" && rawId) {
        return rawId;
      }
      if (typeof rawId === "number") {
        return String(rawId);
      }
      const exerciseId = (selectedQuestionForPopup as { exerciseId?: unknown }).exerciseId;
      const orderIndex = (selectedQuestionForPopup as { order_index?: unknown }).order_index;
      if (exerciseId != null) {
        const exerciseKey =
          typeof exerciseId === "string" || typeof exerciseId === "number"
            ? String(exerciseId)
            : "exercise";
        const orderKey =
          typeof orderIndex === "number"
            ? orderIndex
            : typeof orderIndex === "string"
            ? Number.parseInt(orderIndex, 10) || 0
            : 0;
        return `${exerciseKey}-${orderKey}`;
      }
      const textSource =
        typeof (selectedQuestionForPopup as { question_text?: unknown }).question_text === "string"
          ? ((selectedQuestionForPopup as { question_text?: string }).question_text ?? "")
          : typeof (selectedQuestionForPopup as { text?: unknown }).text === "string"
          ? ((selectedQuestionForPopup as { text?: string }).text ?? "")
          : "";
      return textSource ? `question-${textSource.slice(0, 32)}` : undefined;
    })();

    const questionType = (selectedQuestionForPopup.question_type || selectedQuestionForPopup.type || "sql").toLowerCase();

    // Populate the editor with something useful so Python/SQL prompts never start empty.
    const generateStarterCode = () => {
      const languageConfig: Record<string, string> = {
        sql: `-- Write your SQL query here\n-- ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\n-- Example solution:\n-- SELECT * FROM table_name;\n\n`,
        python: `# Write your Python code here\n# ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\ndef solution():\n    # Your code here\n    pass\n\nsolution()\n`,
        google_sheets: `=${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\n`,
        statistics: `# Statistical analysis solution\n# ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\nimport pandas as pd\nimport numpy as np\n\n# Your analysis here\n`,
        reasoning: `# Logical reasoning solution\n# ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\n`,
        math: `# Mathematical solution\n# ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\n`,
        geometry: `# Geometric solution\n# ${selectedQuestionForPopup.text || selectedQuestionForPopup.question_text}\n\n`,
      };

      return languageConfig[questionType] || languageConfig.sql;
    };

    const fallbackStarter = generateStarterCode();

    if (questionType === "python" || questionType === "statistics") {
      const inlineStarter =
        typeof (selectedQuestionForPopup as any)?.exercisePythonDataset === "string"
          ? ((selectedQuestionForPopup as any)?.exercisePythonDataset as string)
          : undefined;
      const hasInlineStarter = typeof inlineStarter === "string" && inlineStarter.trim().length > 0;
      const hasDatasetStarter =
        typeof pythonStarterFromDatasets === "string" && pythonStarterFromDatasets.trim().length > 0;
      const datasetStarter = hasInlineStarter
        ? inlineStarter
        : hasDatasetStarter
        ? pythonStarterFromDatasets
        : undefined;
      const starter = datasetStarter ?? fallbackStarter;

      const trimmedCurrent = pythonCode.trim();
      const trimmedFallback = fallbackStarter.trim();

      if (!trimmedCurrent || trimmedCurrent === trimmedFallback) {
        setPythonCode(starter);
      }
    } else if (questionType === "sql") {
      const hasAppliedStarter = questionKey ? sqlStarterAppliedRef.current[questionKey] : false;
      if (!sqlCode.trim() && !hasAppliedStarter) {
        setSqlCode(fallbackStarter);
        if (questionKey) {
          sqlStarterAppliedRef.current[questionKey] = true;
        }
      }
    } else if (questionType === "google_sheets") {
      if (!sqlCode.trim()) {
        setSqlCode(fallbackStarter);
      }
    } else {
      if (!sqlCode.trim()) {
        setSqlCode(fallbackStarter);
      }
    }
  }, [
    pythonCode,
    pythonStarterFromDatasets,
    selectedQuestionForPopup?.id,
    selectedQuestionForPopup?.question_type,
    selectedQuestionForPopup?.type,
    sqlCode,
  ]);


  useEffect(() => {
    if (!selectedQuestionForPopup || !shouldUseDuckDb) {
      setDuckDbTables([]);
      setDuckDbSetupError(null);
      setIsPreparingDuckDb(false);
      setDuckDbDatasetTables({});
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

    const fetchCurrentTables = async (): Promise<string[]> => {
      const result = await executeDuckDbQuery("SHOW TABLES;");
      if (!result.success || !result.result) {
        return [];
      }

      return result.result.rows
        .map((row) => {
          if (Array.isArray(row)) {
            const firstValue = row.find((value) => typeof value === "string");
            return firstValue ? String(firstValue) : undefined;
          }
          if (typeof row === "string") {
            return row;
          }
          if (row && typeof row === "object") {
            const values = Object.values(row as Record<string, unknown>);
            const firstValue = values.find((value) => typeof value === "string");
            return firstValue ? String(firstValue) : undefined;
          }
          return undefined;
        })
        .filter((value): value is string => Boolean(value));
    };

    const resetDatabase = async () => {
      const tables = await fetchCurrentTables();
      for (const tableName of tables) {
        await executeDuckDbQuery(`DROP TABLE IF EXISTS "${escapeIdentifier(String(tableName))}"`);
      }
    };

    const prepareDatasets = async () => {
      // console.log("[DuckDB] Preparing datasets...", {
      //   questionId: selectedQuestionForPopup?.id,
      //   datasets: duckDbDatasets.map((dataset) => ({
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
      setDuckDbDatasetTables({});

      try {
        await resetDatabase();

        let currentTables = await fetchCurrentTables();
        const datasetTableMap: Record<string, string[]> = {};

        for (const dataset of duckDbDatasets) {
          if (cancelled) {
            return;
          }

          const beforeTables = new Set(currentTables);
          const creationSql = normalizeCreationSql(dataset.creation_sql);
          const datasetKey =
            dataset.cacheKey ??
            deriveDatasetKey({
              id: dataset.id,
              table_name: dataset.table_name,
              creation_sql: creationSql,
            });

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

          currentTables = await fetchCurrentTables();
          if (datasetKey) {
            const newTables = currentTables.filter((table) => !beforeTables.has(table));
            const fallbackTables =
              newTables.length > 0
                ? newTables
                : dataset.table_name && currentTables.includes(dataset.table_name)
                ? [dataset.table_name]
                : [];
            const expectedTables = creationSql ? extractTableNamesFromSql(creationSql) : [];
            const combinedTables = new Set<string>(datasetTableMap[datasetKey] ?? []);

            for (const tableName of [...newTables, ...fallbackTables, ...expectedTables]) {
              if (typeof tableName === "string" && tableName.trim().length > 0) {
                combinedTables.add(tableName);
              }
            }

            if (combinedTables.size > 0) {
              datasetTableMap[datasetKey] = Array.from(combinedTables);
            }
          }
        }

        if (!cancelled) {
          setDuckDbDatasetTables(datasetTableMap);
          setDuckDbTables(currentTables);
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
    duckDbDatasets,
    datasetLoadSignature,
    executeDuckDbQuery,
    loadDuckDbDataset,
    isDuckDbReady,
    selectedQuestionForPopup,
    selectedQuestionType,
    shouldUseDuckDb,
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
    const exerciseDatasetType = resolveDatasetLanguage(
      activeExercise?.subject_type,
      activeExercise?.exercise_type,
      activeExercise?.practice_type,
      activeExercise?.type,
    );
    setActiveExerciseQuestion(
      {
        ...firstQuestion,
        exerciseId: activeExercise.id ? String(activeExercise.id) : null,
        exerciseTitle: activeExercise.title,
        exerciseDescription: activeExercise.description,
        exerciseDataset: normalizeCreationSql(activeExercise.dataset, {
          datasetType: exerciseDatasetType,
        }),
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
            <div className="pointer-events-auto absolute right-4 top-4 z-30">
              {renderContentExpansionToggle("dark")}
            </div>

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

                  {/* <span>{lectureMeta}</span> */}

                  <span className="mx-2 text-white/40">|</span>

                  {/* <span>{lessonMeta}</span> */}

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Learning Material</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{selectedSection.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{lessonMeta}</p>
            </div>
            <div className="flex items-center justify-end">
              {renderContentExpansionToggle("light")}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-6">

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">

            {lectureNode}

          </div>

        </div>

      </div>

    );

  };

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedSection?.title} - {activeQuiz.title || resourceLabels.quiz}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Question {currentQuizQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            <div className="flex items-center justify-end">
              {renderContentExpansionToggle("light")}
            </div>
          </div>
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
                  {Math.round(((adaptiveQuizSummary.responses?.filter((r: any) => r.is_correct).length || 0) / (adaptiveQuizSummary.responses?.length || 1)) * 100)}%
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
            <h3
              className="text-lg font-medium text-gray-900 mb-4"
              dangerouslySetInnerHTML={{ __html: sanitizeQuestionHTML(currentAdaptiveQuestion.question_text) }}
            />

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
              <span>{submittingAdaptiveAnswer ? 'Submit' : 'Submit'}</span>
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
              {/* sow the soinner while waiting for next question */}
              {submittingAdaptiveAnswer ? (
                <div className="inline-block h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
              ) : (
                <span>Next</span>
              )}
              {/* <span>Next</span> */}
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

    const resolvedQuestionHtmlSource = resolveQuestionTextPreservingFormatting(
      question.text,
      question.question_text,
      (question as any)?.business_question,
      (question as any)?.prompt,
      typeof (question as any)?.content === "string"
        ? (question as any)?.content
        : typeof (question as any)?.content?.text === "string"
        ? (question as any)?.content?.text
        : undefined,
    );
    const questionHtml = resolvedQuestionHtmlSource
      ? sanitizeQuestionHTML(resolvedQuestionHtmlSource)
      : "";

    const pythonStarterCode = (() => {
      if (questionType !== "python") {
        return undefined;
      }

      const resolvePythonCreationSource = (candidate: unknown): string | undefined => {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          return undefined;
        }
        const record = candidate as Record<string, unknown>;
        const schemaInfoRaw = record["schema_info"];
        const schemaInfo =
          schemaInfoRaw && typeof schemaInfoRaw === "object" && !Array.isArray(schemaInfoRaw)
            ? (schemaInfoRaw as Record<string, unknown>)
            : undefined;

        return coalesceString(
          typeof record["create_python"] === "string" ? (record["create_python"] as string) : undefined,
          typeof record["creation_python"] === "string" ? (record["creation_python"] as string) : undefined,
          schemaInfo && typeof schemaInfo["create_python"] === "string"
            ? (schemaInfo["create_python"] as string)
            : undefined,
          schemaInfo && typeof schemaInfo["creation_python"] === "string"
            ? (schemaInfo["creation_python"] as string)
            : undefined,
          schemaInfo && typeof schemaInfo["data_creation_python"] === "string"
            ? (schemaInfo["data_creation_python"] as string)
            : undefined,
          typeof record["data_creation_python"] === "string"
            ? (record["data_creation_python"] as string)
            : undefined,
        );
      };

      const normalizePythonStarter = (source?: string | undefined) =>
        source
          ? normalizeCreationSql(source, {
              datasetType: "python",
              preserveFormatting: true,
            })
          : undefined;

      const candidateIds = new Set<string>();
      const candidateDatasets: PythonDatasetDefinition[] = [];
      const pushCandidate = (dataset?: PythonDatasetDefinition) => {
        if (!dataset) {
          return;
        }
        const key =
          typeof dataset.id === "string" && dataset.id.length > 0
            ? dataset.id
            : `${dataset.name ?? "dataset"}:${candidateDatasets.length}`;
        if (candidateIds.has(key)) {
          return;
        }
        candidateIds.add(key);
        candidateDatasets.push(dataset);
      };

      const activeBaseId = activeDatasetId
        ? (duckDbDatasetVariants.find(v => v.id === activeDatasetId)?.baseDatasetId ?? activeDatasetId)
        : null;

      const activeDefinition =
        activeBaseId
          ? availablePythonDatasets.find((dataset) => dataset.id === activeBaseId)
          : undefined;

      pushCandidate(activeDefinition);
      availablePythonDatasets.forEach((dataset) => pushCandidate(dataset));

      for (const dataset of candidateDatasets) {
        const normalized = normalizePythonStarter(resolvePythonCreationSource(dataset));
        if (normalized) {
          return normalized;
        }
      }

      const fallbackNormalized = normalizePythonStarter(
        resolvePythonCreationSource(questionDataset) ??
          resolvePythonCreationSource(
            (selectedQuestionForPopup as Record<string, unknown> | null | undefined)?.dataset,
          ) ??
          resolvePythonCreationSource(selectedQuestionForPopup),
      );

      return fallbackNormalized ?? undefined;
    })();

    const languageConfig: Record<string, { name: string; starterCode: string }> = {
      sql: {
        name: "SQL",
        starterCode: `-- Write your SQL query here\n-- ${question.text || question.question_text}\n\n-- Example solution:\n-- SELECT * FROM table_name;\n\n`,
      },
      python: {
        name: "Python",
        starterCode:
          pythonStarterCode ??
          `# Write your Python code here\n# ${question.text || question.question_text}\n\ndef solution():\n    # Your code here\n    pass\n\nsolution()\n`,
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
    const duckDbDatasetsForQuestion = shouldUseDuckDb ? duckDbDatasetVariants : [];
    const activeDuckDbDataset =
      shouldUseDuckDb && activeDatasetId
        ? duckDbDatasetsForQuestion.find((dataset) => dataset.id === activeDatasetId) ?? null
        : null;

    const formatDatasetTimestamp = (rawValue: unknown) => {
      const numericValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string"
          ? Number(rawValue.trim())
          : NaN;

      if (!Number.isFinite(numericValue)) {
        return null;
      }

      const timestampMs = numericValue < 1e12 ? numericValue * 1000 : numericValue;
      const parsedDate = new Date(timestampMs);

      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }

      return parsedDate.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatCellValue = (value: unknown, columnName?: string) => {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim().length === 0) ||
        (typeof value === "string" && value.trim().toUpperCase() === "NULL")
      ) {
        return "—";
      }

      const normalizedColumn = columnName?.trim();
      if (normalizedColumn && DATASET_TIMESTAMP_COLUMNS.has(normalizedColumn)) {
        const formattedTimestamp = formatDatasetTimestamp(value);
        if (formattedTimestamp) {
          return formattedTimestamp;
        }
      }

      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }

      return String(value);
    };

    const containerClass = isEmbedded
      ? "flex flex-col rounded-2xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-lg overflow-hidden"
      : "bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col";

    const headerTitle =
      question.exerciseTitle || activeExercise?.title || selectedSection?.title || "Exercise";
    const headerSubtitle =
      question.exerciseDescription || activeExercise?.description || selectedSection?.overview || "";
    const trimmedSubtitle =
      typeof headerSubtitle === "string" && headerSubtitle.length > 160
        ? `${headerSubtitle.slice(0, 157)}...`
        : headerSubtitle;
    const businessContext = activeExercise?.content || "";

    const header = (
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {isEmbedded ? "Practice Exercise" : "Practice Question"}
          </p>
          <h2 className="mt-2 truncate text-xl font-semibold text-slate-900">{headerTitle}</h2>
          {trimmedSubtitle && (
            <p className="mt-1 text-sm text-slate-500">{trimmedSubtitle}</p>
            
          )}
          {businessContext && (
            <p className="mt-1 text-sm text-slate-500"><strong>Business Context:</strong> {businessContext}</p>
          )}
        </div>
        <div className="flex items-right gap-2">
          {/* {renderContentExpansionToggle("light")} */}
          {isEmbedded && (
            <button
              onClick={handleExitEmbeddedExercise}
              className="flex items-right gap-2 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Exit
            </button>
          )}
          {/* <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              questionType === "sql"
                ? "bg-blue-100 text-blue-700"
                : questionType === "python" || questionType === "statistics"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {config.name}
          </span> */}
          {!isEmbedded && (
            <button
              onClick={() => {
                setShowQuestionPopup(false);
                setSelectedQuestionForPopup(null);
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Circle className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    );

    const questionTabsBar =
      questionList.length > 0 ? (
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {questionList.map((questionItem: any, index: number) => {
              const key = getExerciseQuestionKey(questionItem, index);
              const status = questionCompletionStatus[key] === "completed";
              const isActive = index === currentQuestionIndex;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectExerciseQuestionTab(index)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-indigo-600 bg-indigo-600 text-white shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {status ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  <span>Question {index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null;

    const content = (
      <div className="grid min-h-[520px] flex-1 grid-cols-1 overflow-hidden md:grid-cols">
        <div className="flex min-h-0 flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Question</h3>
                {questionHtml ? (
                  <div
                    className="mt-2 text-sm leading-relaxed text-slate-700 prose prose-sm prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: questionHtml }}
                  />
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {question.text || question.question_text}
                  </p>
                )}
              </div>
              {questionDifficulty && (
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    questionDifficulty === "Beginner"
                      ? "bg-emerald-100 text-emerald-700"
                      : questionDifficulty === "Intermediate"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {questionDifficulty}
                </span>
              )}
            </div>
            {questionHint && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <span className="font-medium">Hint:</span> {questionHint}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-6 py-5">
            {questionType === "sql" || questionType === "python" || questionType === "statistics" || questionType === "google_sheets"  ? (
              <div className="flex min-h-full flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Dataset Preview
                  </h4>
                  {duckDbDatasetsForQuestion.length > 1 && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {duckDbDatasetsForQuestion.map((dataset) => {
                        const isActive = dataset.id === activeDatasetId;
                        const label = dataset.resolvedTableName || "Dataset";

                        return (
                          <button
                            key={dataset.id}
                            onClick={() => setActiveDatasetId(dataset.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-indigo-600"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">
                        {activeDuckDbDataset?.resolvedTableName ||
                          activeDuckDbDataset?.name ||
                          activeDuckDbDataset?.table_name ||
                          "Dataset"}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        {(activeDuckDbDataset?.resolvedTableName ?? activeDuckDbDataset?.table_name) && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                            Table: {activeDuckDbDataset.resolvedTableName ?? activeDuckDbDataset.table_name}
                          </span>
                        )}
                        {activeDuckDbDataset?.columns?.length ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5">
                            Columns: {activeDuckDbDataset.columns.slice(0, 6).join(", ")}
                            {activeDuckDbDataset.columns.length > 6
                              ? ` +${activeDuckDbDataset.columns.length - 6}`
                              : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {(datasetPreview || loadingDatasetPreview) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            downloadDatasetPreview({
                              fileName:
                                activeDuckDbDataset?.resolvedTableName ||
                                activeDuckDbDataset?.name ||
                                activeDuckDbDataset?.table_name ||
                                "dataset",
                              worksheetName:
                                activeDuckDbDataset?.resolvedTableName ||
                                activeDuckDbDataset?.table_name ||
                                activeDuckDbDataset?.name ||
                                "Dataset",
                            })
                          }
                          disabled={!datasetPreview || downloadingDataset}
                          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{downloadingDataset ? "Preparing..." : "Download .xlsx"}</span>
                        </button>
                        {loadingDatasetPreview && (
                          <div className="flex items-center gap-2 text-xs text-indigo-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                            <span>Preparing preview...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {datasetPreview ? (
                      <div className="max-h-[320px] px-5 py-4 overflow-x-auto overflow-y-auto">
                        <table className="min-w-full border-collapse text-xs text-slate-700">
                          <thead className="sticky top-0 bg-slate-100">
                            <tr>
                              {datasetPreview.columns.map((column) => (
                                <th
                                  key={column}
                                  className="border border-slate-200 px-3 py-2 text-left font-semibold"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {datasetPreview.rows.map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                              >
                                  {row.map((cell, cellIndex) => {
                                    const columnName = datasetPreview.columns[cellIndex];
                                    const formattedValue = formatCellValue(cell, columnName);
                                    return (
                                      <td
                                        key={`${rowIndex}-${cellIndex}`}
                                        className="border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600"
                                      >
                                        <span
                                          className="block max-w-[140px] truncate"
                                          title={formattedValue}
                                        >
                                          {formattedValue}
                                        </span>
                                      </td>
                                    );
                                  })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 py-10 text-center">
                        <p className="text-sm text-slate-500">
                          {datasetPreviewError
                            ? datasetPreviewError
                            : loadingDatasetPreview
                            ? "Preparing dataset preview..."
                            : duckDbDatasetsForQuestion.length === 0
                            ? "No datasets available for this question."
                            : "Preview not available. Try running the dataset creation SQL from the editor."}
                        </p>
                      </div>
                    )}
                  </div>
                  {activeDuckDbDataset?.creation_sql && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                      <button
                        onClick={() => {
                          if (activeDuckDbDataset?.creation_sql) {
                            setSqlCode(activeDuckDbDataset.creation_sql);
                          }
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Load creation SQL into editor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : questionType === "python" || questionType === "statistics" ? (
              pythonDatasetOptions.length > 0 ? (
                <div className="flex min-h-full flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Dataset Preview
                    </h4>
                    {pythonDatasetOptions.length > 1 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {pythonDatasetOptions.map((option) => {
                          const isActive = option.id === activeDatasetId;
                          const detail = pythonDatasetDetails[option.baseDatasetId];
                          const label = option.label;
                          const tooltip =
                            detail?.originalName && detail.originalName !== label
                              ? detail.originalName
                              : option.originalName && option.originalName !== label
                              ? option.originalName
                              : undefined;
                          return (
                            <button
                              key={option.id}
                              onClick={() => setActiveDatasetId(option.id)}
                              title={tooltip}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-indigo-600"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                      <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">
                        {activePythonDatasetDetail?.displayName ||
                          availablePythonDatasets.find(
                            (dataset) => dataset.id === activePythonBaseDatasetId,
                          )?.name ||
                          pythonDatasetOptions.find((option) => option.id === activeDatasetId)?.label ||
                          "Dataset"}
                        </span>
                        {activePythonDatasetDetail?.tableNames?.length ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Table
                            {activePythonDatasetDetail.tableNames.length > 1 ? "s" : ""}:{" "}
                            <span className="font-mono">
                              {activePythonDatasetDetail.tableNames.join(", ")}
                            </span>
                          </p>
                        ) : null}
                        {activePythonDatasetDetail?.originalName &&
                          activePythonDatasetDetail.originalName !==
                            (activePythonDatasetDetail.displayName || activePythonDatasetDetail.name) && (
                            <p className="mt-1 text-xs text-slate-500">
                              Original label: {activePythonDatasetDetail.originalName}
                            </p>
                          )}
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          {activePythonDatasetDetail?.pythonVariable && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                              Variable: {activePythonDatasetDetail.pythonVariable}
                            </span>
                          )}
                          {typeof activePythonDatasetDetail?.rowCount === "number" && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5">
                              Rows: {activePythonDatasetDetail.rowCount}
                            </span>
                          )}
                          {/* {activePythonDatasetStatus?.state === "loaded" && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                              Loaded into Pyodide
                            </span>
                          )} */}
                          {activePythonDatasetStatus?.state === "loading" && (
                            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-700">
                              Loading into Pyodide...
                            </span>
                          )}
                          {activePythonDatasetStatus?.state === "failed" && (
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-rose-700">
                              Load failed
                            </span>
                          )}
                        </div>
                      </div>
                      {(datasetPreview || loadingDatasetPreview) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const selectedOption =
                                pythonDatasetOptions.find((option) => option.id === activeDatasetId) ??
                                pythonDatasetOptions[0];
                              const definition =
                                availablePythonDatasets.find(
                                  (dataset) => dataset.id === selectedOption?.baseDatasetId,
                                ) ??
                                availablePythonDatasets[0] ??
                                null;
                              downloadDatasetPreview({
                                fileName:
                                  activePythonDatasetDetail?.displayName ||
                                  definition?.name ||
                                  definition?.table_name ||
                                  selectedOption?.label ||
                                  "dataset",
                                worksheetName:
                                  activePythonDatasetDetail?.pythonVariable ||
                                  definition?.table_name ||
                                  activePythonDatasetDetail?.displayName ||
                                  definition?.name ||
                                  selectedOption?.label ||
                                  "Dataset",
                              });
                            }}
                            disabled={!datasetPreview || downloadingDataset}
                            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{downloadingDataset ? "Preparing..." : "Download .xlsx"}</span>
                          </button>
                          {loadingDatasetPreview && (
                            <div className="flex items-center gap-2 text-xs text-indigo-600">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                              <span>Preparing preview...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {datasetPreview ? (
                        <div className="max-h-[320px] px-5 py-4 overflow-x-auto overflow-y-auto">
                          <table className="min-w-full border-collapse text-xs text-slate-700">
                            <thead className="sticky top-0 bg-slate-100">
                              <tr>
                                {datasetPreview.columns.map((column) => (
                                  <th
                                    key={column}
                                    className="border border-slate-200 px-3 py-2 text-left font-semibold"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {datasetPreview.rows.map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                >
                                  {row.map((cell, cellIndex) => {
                                    const columnName = datasetPreview.columns[cellIndex];
                                    const formattedValue = formatCellValue(cell, columnName);
                                    return (
                                      <td
                                        key={`${rowIndex}-${cellIndex}`}
                                        className="border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600"
                                      >
                                        <span
                                          className="block max-w-[140px] truncate"
                                          title={formattedValue}
                                        >
                                          {formattedValue}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center px-5 py-10 text-center">
                          <p className="text-sm text-slate-500">
                            {datasetPreviewError
                              ? datasetPreviewError
                              : loadingDatasetPreview
                              ? "Preparing dataset preview..."
                              : pythonDatasetOptions.length === 0
                              ? "No datasets available for this question."
                              : "Dataset preview is not available yet for this Python question."}
                          </p>
                        </div>
                      )}
                    </div>
                    {(activePythonDatasetStatus?.message || activePythonDatasetDetail?.description) && (
                      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
                        {activePythonDatasetStatus?.message && (
                          <p className="mb-1 text-rose-600">{activePythonDatasetStatus.message}</p>
                        )}
                        {activePythonDatasetDetail?.description && (
                          <p>{activePythonDatasetDetail.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                  <p className="px-6 text-sm text-slate-500">
                    No datasets were provided for this Python question.
                  </p>
                </div>
              )
            ) : questionType === "google_sheets" ? (
              <div className="flex min-h-full flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Dataset Preview
                  </h4>
                  {spreadsheetDatasets.length > 1 && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {spreadsheetDatasets.map((dataset) => {
                        const isActive = dataset.id === activeDatasetId;
                        const label = dataset.name || "Dataset";
                        const tooltip =
                          dataset.originalName && dataset.originalName !== label
                            ? dataset.originalName
                            : undefined;
                        return (
                          <button
                            key={dataset.id}
                            onClick={() => setActiveDatasetId(dataset.id)}
                            title={tooltip}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-indigo-600"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        {activeSpreadsheetDataset?.name || "Dataset"}
                      </span>
                      {activeSpreadsheetDataset?.tableNames?.length ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Table
                          {activeSpreadsheetDataset.tableNames.length > 1 ? "s" : ""}:{" "}
                          <span className="font-mono">
                            {activeSpreadsheetDataset.tableNames.join(", ")}
                          </span>
                        </p>
                      ) : null}
                      {activeSpreadsheetDataset?.originalName &&
                        activeSpreadsheetDataset.originalName !== activeSpreadsheetDataset.name && (
                          <p className="mt-1 text-xs text-slate-500">
                            Original label: {activeSpreadsheetDataset.originalName}
                          </p>
                        )}
                      {activeSpreadsheetDataset?.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {activeSpreadsheetDataset.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadDatasetPreview({
                            fileName:
                              activeSpreadsheetDataset?.name ||
                              selectedQuestionForPopup?.exerciseTitle ||
                              "dataset",
                            worksheetName: activeSpreadsheetDataset?.name || "Dataset",
                          })
                        }
                        disabled={!datasetPreview || downloadingDataset}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{downloadingDataset ? "Preparing..." : "Download .xlsx"}</span>
                      </button>
                      {loadingDatasetPreview && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                          <span>Preparing preview...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {datasetPreview ? (
                      <div className="max-h-[320px] px-5 py-4 overflow-x-auto overflow-y-auto">
                        <table className="min-w-full border-collapse text-xs text-slate-700">
                          <thead className="sticky top-0 bg-slate-100">
                            <tr>
                              {datasetPreview.columns.map((column) => (
                                <th
                                  key={column}
                                  className="border border-slate-200 px-3 py-2 text-left font-semibold"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {datasetPreview.rows.map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                              >
                                {row.map((cell, cellIndex) => {
                                  const columnName = datasetPreview.columns[cellIndex];
                                  const formattedValue = formatCellValue(cell, columnName);
                                  return (
                                    <td
                                      key={`${rowIndex}-${cellIndex}`}
                                      className="border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600"
                                    >
                                      <span
                                        className="block max-w-[140px] truncate"
                                        title={formattedValue}
                                      >
                                        {formattedValue}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 py-10 text-center">
                        <p className="text-sm text-slate-500">
                          {datasetPreviewError
                            ? datasetPreviewError
                            : "Dataset preview is not available yet for this activity."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                <p className="px-6 text-sm text-slate-500">
                  No dataset preview for {config.name} questions.
                </p>
              </div>
            )}
          </div>
        </div>
        {isSpreadsheetQuestion || selectedQuestionType === "statistics" ? (
          <div className="flex min-h-0 flex-col bg-white">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Google Sheets Workspace</h3>
                  <p className="text-sm text-slate-500">
                    Download the dataset, work through the task in Google Sheets, then return to mark this question complete.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  <p>
                    {selectedQuestionForPopup?.exerciseDescription
                      ? selectedQuestionForPopup.exerciseDescription
                      : "Use Google Sheets to explore the dataset, apply any formulas you need, and capture your findings before submitting."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      downloadDatasetPreview({
                        fileName:
                          activeSpreadsheetDataset?.name ||
                          selectedQuestionForPopup?.exerciseTitle ||
                          "dataset",
                        worksheetName: activeSpreadsheetDataset?.name || "Dataset",
                      })
                    }
                    disabled={!datasetPreview || downloadingDataset}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <Download className="h-4 w-4" />
                    <span>{downloadingDataset ? "Preparing..." : "Download Dataset"}</span>
                  </button>
                  <button
                    onClick={() => markQuestionCompleted(selectedQuestionForPopup)}
                    className="rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => handleNavigateExerciseQuestion(1)}
                    disabled={!hasNextQuestion}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">Suggested steps</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>Import the downloaded file into Google Sheets.</li>
                    <li>Use filters, formulas, or charts to answer the prompt.</li>
                    <li>Record your conclusion, then mark the question complete here.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          selectedQuestionType !== "statistics" && (
            <div className="flex min-h-0 flex-col bg-white">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{config.name} Workspace</h3>
                    <p className="text-sm text-slate-500">
                      Craft your solution and run it against the dataset. Output appears below.
                    </p>
                  </div>
                  {(isExecutingSql || isExecutingPython) && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                      <span>Running...</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-inner">
                  {/* Debug: Show current state */}
                  {/* <div className="text-xs text-slate-400 px-5 py-2 border-b border-slate-700">
                    Language: {codeLanguage} | SQL: {sqlCode.length}c | Python: {pythonCode.length}c
                  </div> */}
                  
                  <textarea
                    key={`${selectedQuestionForPopup?.id}-${codeLanguage}`}
                    value={
                      codeLanguage === 'python'
                        ? pythonCode
                        : sqlCode
                    }
                    onChange={(e) => {
                      if (codeLanguage === 'python' || codeLanguage === 'statistics') {
                        setPythonCode(e.target.value);
                      } else {
                        setSqlCode(e.target.value);
                      }
                    }}
                    className="flex-1 resize-none bg-transparent p-5 font-mono text-sm leading-6 tracking-tight text-slate-100 outline-none placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Start coding..."
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 bg-slate-900/60 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {!isPyodideReady &&
                        (questionType === "python" || questionType === "statistics") && (
                        <span className="rounded-full bg-slate-800 px-3 py-1">Preparing Python runtime...</span>
                      )}
                      {!isDuckDbReady && questionType === "sql" && (
                        <span className="rounded-full bg-slate-800 px-3 py-1">Preparing DuckDB...</span>
                      )}
                      {duckDbTables.length > 0 && questionType === "sql" && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                          Tables: {duckDbTables.slice(0, 4).join(", ")}
                          {duckDbTables.length > 4 ? ` +${duckDbTables.length - 4}` : ""}
                        </span>
                      )}
                      {/* {(sqlError || pythonError) && (
                        <span className="rounded-full bg-rose-900/60 px-3 py-1 text-rose-200">
                          {sqlError || pythonError}
                        </span>
                      )} */}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExecuteCode(
                          codeLanguage === 'python' || codeLanguage === 'statistics'
                            ? pythonCode
                            : sqlCode
                        )}
                        disabled={
                          isExecutingSql ||
                          isExecutingPython ||
                          (codeLanguage === 'python' || codeLanguage === 'statistics'
                            ? !pythonCode.trim() || !isPyodideReady
                            : !sqlCode.trim() || (!isDuckDbReady || isPreparingDuckDb))
                        }
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                      >
                        <Play className="h-4 w-4" />
                        {isExecutingSql || isExecutingPython ? "Running..." : "Run"}
                      </button>
                      <button
                        onClick={() => markQuestionCompleted(question)}
                        className="rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => handleNavigateExerciseQuestion(1)}
                        disabled={!hasNextQuestion || isPreparingDuckDb || isDuckDbLoading}
                        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-5">
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-950 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Output</h4>
                    <div className="flex items-center gap-3">
                      {(isDuckDbLoading || isPreparingDuckDb) && (
                        <div className="flex items-center gap-2 text-xs text-indigo-300">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                          <span>{isDuckDbLoading ? "Initializing DuckDB..." : "Loading datasets..."}</span>
                        </div>
                      )}

                      {isPyodideLoading && (
                        <div className="flex items-center gap-2 text-xs text-indigo-300">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                          <span>Initializing Python runtime...</span>
                        </div>
                      )}

                      <button
                        onClick={handleClearOutput}
                        disabled={!canClearOutput || isExecutingSql || isExecutingPython}
                        className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto px-5 py-4 font-mono text-sm text-emerald-200">
                    {duckDbError && (
                      <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-900/30 px-3 py-2 text-rose-200">
                        {duckDbError}
                      </div>
                    )}
                    {/* {duckDbSetupError && (
                      <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-rose-200">
                        {duckDbSetupError}
                      </div>
                    )} */}
                    {sqlResults.length === 0 && !sqlError && !isExecutingSql && !pythonOutput && !pythonError && !isExecutingPython && (
                      <div className="text-sm text-slate-400">
                        {sqlCode.trim()
                          ? "Run your solution to inspect the output here."
                          : "Start coding above to see your output stream here."}
                      </div>
                    )}
                    {pythonOutput && (
                      <div className="mb-6">
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-4 py-3">
                          <pre className="whitespace-pre-wrap text-emerald-200 text-xs">{pythonOutput}</pre>
                        </div>
                      </div>
                    )}
                    {pythonError && (
                      <div className="mb-6">
                        <div className="rounded-lg border border-rose-500/40 bg-rose-900/40 px-4 py-3">
                          <pre className="whitespace-pre-wrap text-rose-100 text-xs">{pythonError}</pre>
                        </div>
                      </div>
                    )}
                    {sqlResults.map((result, index) => (
                      <div key={index} className="mb-6">
                        {result.columns.length > 0 && result.values.length > 0 ? (
                          <div className="rounded-lg border border-emerald-500/30 overflow-x-auto">
                            <table className="min-w-full border-collapse text-xs">
                              <thead className="bg-emerald-900/40 text-emerald-100">
                                <tr>
                                  {result.columns.map((col: string) => (
                                    <th key={col} className="px-3 py-2 text-left font-semibold">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.values.slice(0, 15).map((row: any[], rowIndex: number) => (
                                  <tr
                                    key={rowIndex}
                                    className={rowIndex % 2 === 0 ? "bg-emerald-950/60" : "bg-emerald-900/40"}
                                  >
                                    {row.map((cell: any, cellIndex: number) => (
                                      <td key={cellIndex} className="px-3 py-2 text-emerald-200">
                                        {cell ?? "NULL"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                                {result.values.length > 15 && (
                                  <tr>
                                    <td
                                      colSpan={result.columns.length}
                                      className="px-3 py-2 text-center text-xs text-emerald-300"
                                    >
                                      ... {result.values.length - 15} more rows ...
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-emerald-500/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">
                            Query executed successfully (no rows returned).
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
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
    : null;

  return (

    <div
      className={`relative grid grid-cols-1 gap-6 h-full min-h-0 overflow-hidden ${
        !isContentExpanded ? "xl:grid-cols-[1fr_380px]" : ""
      }`}
    >

      <div ref={mainContentRef} className="space-y-6 min-w-0 overflow-y-auto">

        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">

          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">

                {trackTitle}

                {subjectTitle ? ` / ${subjectTitle}` : ""}

              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">

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

            <div className="flex w-full flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={toggleContentExpanded}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-1"
              >
                <Menu className="h-4 w-4" />
                {isContentExpanded ? "Browse Outline" : "Collapse Outline"}
              </button>

              
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

          canAccessApi={isAuthenticated}

        />

      </div>

      {!isContentExpanded && (
        <aside
          className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-4 overflow-y-auto bg-white/95 px-4 py-6 backdrop-blur-md shadow-xl sm:px-6 xl:static xl:z-auto xl:gap-6 xl:bg-transparent xl:px-0 xl:py-0 xl:shadow-none xl:[scrollbar-width:thin] xl:[&::-webkit-scrollbar]:w-2 xl:[&::-webkit-scrollbar-thumb]:rounded-full xl:[&::-webkit-scrollbar-thumb]:bg-slate-300/60 xl:hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/70 xl:[&::-webkit-scrollbar-track]:bg-transparent xl:max-h-[calc(100dvh-4rem)] xl:overflow-y-auto xl:pr-2"
        >
          <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-indigo-700 shadow-sm xl:hidden">
            <span className="text-sm font-semibold">Course Outline</span>
            <button
              type="button"
              onClick={closeNavigation}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              Collapse
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
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

                    const shouldHideGenerationButtons =
                      exercises.length > 0 || (moduleIndex === 0 && moduleSectionIndex === 0);
                    const adaptiveQuizStatus = activeSectionQuizzes[section.id];
                    const hasActiveAdaptiveQuiz = Boolean(adaptiveQuizStatus?.hasActiveQuiz);
                    const adaptiveButtonLabel = hasActiveAdaptiveQuiz ? "Resume Adaptive Quiz" : "Start Adaptive Quiz";
                    const adaptiveButtonLoadingLabel = hasActiveAdaptiveQuiz ? "Resuming..." : "Starting...";

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

                        className={`group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          isCurrentSection
                            ? "border-indigo-300 bg-indigo-50/90 text-indigo-800 shadow-sm"
                            : "border-transparent bg-white/80 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60"
                        }`}

                      >

                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-600"
                              : isCurrentSection
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : isCurrentSection ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">

                          <div
                            className={`truncate text-sm font-semibold ${
                              isCurrentSection
                                ? "text-indigo-900"
                                : "text-slate-800 group-hover:text-indigo-700"
                            }`}
                          >
                            {section.title}
                          </div>

                          <div
                            className={`mt-1 text-xs ${
                              isCompleted
                                ? "text-emerald-600"
                                : isCurrentSection
                                ? "text-indigo-600"
                                : "text-slate-500"
                            }`}
                          >
                            {isCompleted ? "Completed" : isCurrentSection ? "In Progress" : "Not started"}
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

                                className={`group flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                                  isActiveLecture
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-800 shadow-sm"
                                    : "border-transparent text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
                                }`}

                              >

                                <span
                                  className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                                    isActiveLecture
                                      ? "bg-indigo-100 text-indigo-600"
                                      : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                  }`}
                                >
                                  <Play className="h-3.5 w-3.5" />
                                </span>

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
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 text-sm">{exercise.title}</h4>
                                    {exercise.description && (
                                      <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleSelectExercise(section.id, exercise)}
                                    className="group flex w-full items-center gap-2 rounded-2xl border border-transparent bg-white/80 px-3 py-2 text-sm text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
                                  >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                      <Code className="h-3.5 w-3.5" />
                                    </span>
                                    <span>Open Exercise</span>
                                  </button>
                                  
                                </div>
                              ));
                            } else if (exercises.length > 0) {

                              // Fallback to generic exercises
                              // console.log("Using generic exercises:", exercises);

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
                                    className="group flex w-full items-center gap-2 rounded-2xl border border-transparent bg-white/80 px-3 py-2 text-sm text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
                                  >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                      <Code className="h-3.5 w-3.5" />
                                    </span>
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

                             </>
                          )}

                              {/* Adaptive Quiz Button */}
                              <button
                                onClick={() => handleStartAdaptiveQuiz(section)}
                                disabled={generatingQuiz[section.id] || isAdaptiveQuizMode}
                                className="w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                              >
                                {generatingQuiz[section.id] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{adaptiveButtonLoadingLabel}</span>
                                  </>
                                ) : (
                                  <>
                                    <Activity className="h-4 w-4" />
                                    <span>{adaptiveButtonLabel}</span>
                                  </>
                                )}
                              </button>
                           

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
        </aside>
      )}
    </div>

    );
}
