"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 text-center text-slate-100">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-400">404</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="text-sm text-slate-400 sm:text-base">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-400"
      >
        Go to homepage
      </Link>
    </div>
  );
}

