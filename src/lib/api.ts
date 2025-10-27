// Server-only helper to call NestJS with the user's Supabase JWT.
import "server-only";
import { supabaseServer } from "@/lib/supabase-server";

// For server-side requests, use relative paths which will be rewritten by Next.js
// In production (Vercel), this allows the backend to be called through the rewrite rule
// API_URL is used as fallback for local development server-to-server calls
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const USE_RELATIVE_PATHS = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function apiGet<T>(path: string): Promise<T> {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No auth token");

  const url = USE_RELATIVE_PATHS ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Important: server fetch; no CORS issues and no token leaks to client
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    return (text ? (JSON.parse(text) as T) : (null as unknown as T));
  }
  return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: any): Promise<T> {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No auth token");

  const url = USE_RELATIVE_PATHS ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    return (text ? (JSON.parse(text) as T) : (null as unknown as T));
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No auth token");

  const url = USE_RELATIVE_PATHS ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    return (text ? (JSON.parse(text) as T) : (null as unknown as T));
  }
  return (await res.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No auth token");

  const url = USE_RELATIVE_PATHS ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    return (text ? (JSON.parse(text) as T) : (null as unknown as T));
  }
  return (await res.json()) as T;
}

// Quiz-related API functions
export async function getQuiz(quizId: string) {
  return apiGet(`/v1/quizzes/${quizId}`);
}
