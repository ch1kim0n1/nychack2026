// scripts/setup.mjs
// First-run bootstrap for a fresh clone.
//
//   1. Check Node.js version (>=24 <25 required)
//   2. Copy backend/.env.example  -> backend/.env        (only if absent)
//   3. Copy frontend/.env.example -> frontend/.env.local (only if absent)
//      Existing env files are NEVER overwritten.
//   4. npm install in backend/ and frontend/.
//   5. Validate backend/.env DATABASE_URL port matches docker-compose (5433).
//   6. Print a reminder to set OPENAI_API_KEY in backend/.env.
//
// Cross-platform: child processes use { stdio: 'inherit', shell: true } so
// npm resolves on Windows (npm.cmd) and *nix.
// ASCII-only output (Windows cp1252-safe; no unicode arrows/emoji).

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// --- Node version check --------------------------------------------------

const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major < 24 || major >= 25) {
  console.error(`[setup] ERROR: Node.js 24.x required. Current: ${nodeVersion}`);
  console.error('[setup] Run: nvm use 24   (or install Node.js 24)');
  process.exit(1);
}
console.log(`[setup] Node.js version OK: ${nodeVersion}`);

// Copy `from` -> `to` only when `to` does not already exist.
function copyEnvIfAbsent(fromRel, toRel) {
  const from = resolve(rootDir, fromRel);
  const to = resolve(rootDir, toRel);
  if (existsSync(to)) {
    console.log(`[setup] ${toRel} already exists - left untouched.`);
    return;
  }
  if (!existsSync(from)) {
    console.warn(`[setup] WARNING: ${fromRel} not found - cannot create ${toRel}.`);
    return;
  }
  copyFileSync(from, to);
  console.log(`[setup] Created ${toRel} from ${fromRel}.`);
}

// Run `npm install` in a workspace directory.
function npmInstall(workspaceRel) {
  const cwd = resolve(rootDir, workspaceRel);
  console.log(`[setup] Installing dependencies in ${workspaceRel}/ ...`);
  const result = spawnSync('npm', ['install'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.error) {
    console.error(`[setup] FAILED to launch npm in ${workspaceRel}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[setup] FAILED: npm install in ${workspaceRel} exited with code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log('[setup] CivicLens first-run setup starting...');

// 1 + 2. Env files (only created if absent).
copyEnvIfAbsent('backend/.env.example', 'backend/.env');
copyEnvIfAbsent('frontend/.env.example', 'frontend/.env.local');

// 3. Install dependencies in both workspaces.
npmInstall('backend');
npmInstall('frontend');

// 4. Validate backend/.env DATABASE_URL port.
const backendEnvPath = resolve(rootDir, 'backend/.env');
if (existsSync(backendEnvPath)) {
  const envContent = readFileSync(backendEnvPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^\s"'\n]+)/);
  if (dbUrlMatch) {
    const url = dbUrlMatch[1];
    if (url.includes(':5432/') && !url.includes(':5433/')) {
      console.warn('[setup] WARNING: backend/.env DATABASE_URL uses port 5432, but docker-compose maps Postgres to host port 5433.');
      console.warn('[setup] Updating DATABASE_URL to use port 5433...');
      const fixed = envContent.replace(/(localhost):5432/, '$1:5433');
      writeFileSync(backendEnvPath, fixed, 'utf-8');
      console.log('[setup] Fixed DATABASE_URL port in backend/.env.');
    }
  }
}

// 5. Reminder.
console.log('');
console.log('[setup] Done.');
console.log('[setup] IMPORTANT: set OPENAI_API_KEY in backend/.env before running ingestion / RAG.');
console.log('[setup] Next: npm run dev   (starts DB + migrate + api + web).');
