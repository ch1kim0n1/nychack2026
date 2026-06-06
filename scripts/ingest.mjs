// scripts/ingest.mjs
// Run the Python RAG ingestion pipeline.
//   1. pip install -r requirements.txt   (idempotent)
//   2. python ingest.py
// Both run from backend/ingestion/ so ingest.py finds its relative paths and
// reads backend/.env. This costs OpenAI tokens + network, so it is a separate
// command and is intentionally NOT part of `npm run dev`.
// ASCII-only output (Windows cp1252-safe).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ingestionDir = resolve(__dirname, '..', 'backend', 'ingestion');

// Prefer `python` (Windows / most venvs); fall back to `python3` if missing.
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

function run(cmd, args, label) {
  console.log(`[ingest] ${label}...`);
  const result = spawnSync(cmd, args, {
    cwd: ingestionDir,
    stdio: 'inherit',
    shell: true,
  });
  if (result.error) {
    console.error(`[ingest] FAILED to launch "${cmd}": ${result.error.message}`);
    console.error('[ingest] Is Python installed and on your PATH?');
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[ingest] FAILED: "${label}" exited with code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

run(pythonCmd, ['-m', 'pip', 'install', '-r', 'requirements.txt'], 'Installing Python deps');
run(pythonCmd, ['ingest.py'], 'Running ingestion (ingest.py)');

console.log('[ingest] Done. Live RAG data has been ingested.');
