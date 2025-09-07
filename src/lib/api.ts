// Server-only helper to call NestJS with the user's Supabase JWT.
import "server-only";
import { supabaseServer } from "@/lib/supabase-server";

const API_URL = process.env.API_URL!;

export async function apiGet<T>(path: string): Promise<T> {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${API_URL}${path}`, {
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

  const res = await fetch(`${API_URL}${path}`, {
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

  const res = await fetch(`${API_URL}${path}`, {
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

  const res = await fetch(`${API_URL}${path}`, {
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
