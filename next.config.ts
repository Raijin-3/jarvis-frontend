import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Pin Turbopack root to this app directory to avoid
// Next.js selecting a parent directory with another lockfile.
// This silences the multiple lockfiles warning and ensures
// the correct workspace root is used.
// @ts-ignore - "turbopack" may not be in older NextConfig types
(nextConfig as any).turbopack = {
  root: __dirname,
};

export default nextConfig;
