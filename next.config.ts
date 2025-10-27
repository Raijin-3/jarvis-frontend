import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
  async rewrites() {
    // Get the backend URL from environment
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Only return rewrites if backend URL is a full URL (not a relative path)
    if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
      const destination = backendUrl.replace(/\/$/, '');
      return {
        // Rewrite all /v1/* requests to the backend
        beforeFiles: [
          {
            source: '/v1/:path*',
            destination: `${destination}/v1/:path*`,
          },
        ],
      };
    }

    return {
      beforeFiles: [],
    };
  },
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
  // Disable source maps to prevent 404 errors for source files
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = false;
    }
    
    // Add WebAssembly support for DuckDB-WASM and Pyodide
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Exclude WebAssembly modules from being processed by other loaders
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
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
