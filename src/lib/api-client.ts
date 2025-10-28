"use client";

import { supabaseBrowser } from "./supabase-browser";

const devApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const isProduction = process.env.NODE_ENV === "production";
const devBaseUrl = devApiUrl.replace(/\/$/, "");

const supabase = supabaseBrowser();

function buildRequestUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (isProduction) {
    return normalizedPath;
  }

  return `${devBaseUrl}${normalizedPath}`;
}

async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Supabase auth error: ${error.message}`);
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No auth token");
  }
  return token;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.url} failed: ${res.status} ${text}`);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (!text) {
      return null as unknown as T;
    }
    return JSON.parse(text) as T;
  }

  return (await res.json()) as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const url = buildRequestUrl(path);
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  return parseResponse<T>(res);
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
