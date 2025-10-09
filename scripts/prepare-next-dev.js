#!/usr/bin/env node

/**
 * Next.js (on Windows, particularly when using Turbopack) can attempt to write
 * development manifests before the nested `.next/static/development` directory
 * exists. If the directory is missing, the write fails with ENOENT and the dev
 * server emits noisy errors instead of booting cleanly. Ensuring these
 * directories exist up front keeps the filesystem ready for Next's writers.
 */

const { mkdir } = require('node:fs/promises');
const { join, resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const requiredDirs = [
  join(projectRoot, '.next'),
  join(projectRoot, '.next', 'static'),
  join(projectRoot, '.next', 'static', 'development'),
  join(projectRoot, '.next', 'server'),
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function main() {
  for (const dir of requiredDirs) {
    await ensureDir(dir);
  }
}

main().catch((error) => {
  console.error('[prepare-next-dev] Failed to ensure Next.js directories.', error);
  process.exit(1);
});
