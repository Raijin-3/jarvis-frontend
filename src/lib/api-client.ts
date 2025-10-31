"use client";

import { supabaseBrowser } from "./supabase-browser";

const devApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const isProduction = process.env.NODE_ENV === "production";
const devBaseUrl = devApiUrl.replace(/\/$/, "");
const shouldProxyBackendCalls = isProduction && devBaseUrl.startsWith("http://");

const supabase = supabaseBrowser();

let cachedToken: string | null = null;
let cachedExpiry: number | null = null;
let authListenerRegistered = false;

function ensureAuthListener() {
  if (authListenerRegistered) return;
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token ?? null;
    cachedExpiry = session?.expires_at ?? null;
  });
  // Supabase returns { data: { subscription } }, no need to expose teardown here.
  void listener;
  authListenerRegistered = true;
}

function buildRequestUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // If the path is to the frontend's API routes (starts with /api/), 
  // use a local path as it will be served by this Next.js app
  if (normalizedPath.startsWith("/api/")) {
    // In production, it's just a relative path served locally
    // In dev, we need the full URL to the frontend
    if (isProduction) {
      return normalizedPath;
    }
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003";
    return `${frontendUrl.replace(/\/$/, '')}${normalizedPath}`;
  }
  
  // For backend routes (starts with /v1/), go through server proxy in production if backend lacks HTTPS
  if (normalizedPath.startsWith("/v1/")) {
    if (shouldProxyBackendCalls) {
      return `/api/proxy${normalizedPath}`;
    }
    return `${devBaseUrl}${normalizedPath}`;
  }
  
  // Fallback for other paths
  if (isProduction) {
    return normalizedPath;
  }

  return `${devBaseUrl}${normalizedPath}`;
}

async function getAuthToken() {
  ensureAuthListener();

  if (cachedToken && (!cachedExpiry || cachedExpiry * 1000 - Date.now() > 5_000)) {
    return cachedToken;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Supabase auth error: ${error.message}`);
  }
  const sessionToken = data.session?.access_token ?? null;
  const sessionExpiry = data.session?.expires_at ?? null;
  if (sessionToken) {
    cachedToken = sessionToken;
    cachedExpiry = sessionExpiry;
    return sessionToken;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    throw new Error("No auth token");
  }
  const refreshedToken = refreshed.session?.access_token ?? null;
  const refreshedExpiry = refreshed.session?.expires_at ?? null;
  if (!refreshedToken) {
    throw new Error("No auth token");
  }
  cachedToken = refreshedToken;
  cachedExpiry = refreshedExpiry;
  return refreshedToken;
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
  
  // Validate URL - must be absolute for fetch in dev, can be relative in production
  if (!isProduction && !url.startsWith("http://") && !url.startsWith("https://")) {
    const errorMsg = `Invalid URL built from path "${path}": "${url}". API URL: "${devApiUrl}", isProduction: ${isProduction}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
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
