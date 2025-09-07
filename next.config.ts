import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
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
