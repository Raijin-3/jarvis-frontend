"use client";

import { supabaseBrowser } from "./supabase-browser";

const supabase = supabaseBrowser();

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

  // Use relative path which will be proxied through Vercel to the backend
  const res = await fetch(path, {
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
