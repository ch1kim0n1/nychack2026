// scripts/ingest.mjs
// Run the Python RAG ingestion pipeline.
// On macOS: auto-creates and uses a venv (system pip is restricted by Homebrew).
// On Linux/Windows: uses system python3 / python directly.
// ASCII-only output (Windows cp1252-safe).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ingestionDir = resolve(__dirname, '..', 'backend', 'ingestion');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';

const venvDir = resolve(ingestionDir, '.venv');
const venvPython = isWin
  ? resolve(venvDir, 'Scripts', 'python.exe')
  : resolve(venvDir, 'bin', 'python3');

function run(cmd, args, label) {
  console.log(`[ingest] ${label}...`);
  const result = spawnSync(cmd, args, {
    cwd: ingestionDir,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) {
    console.error(`[ingest] FAILED to launch "${cmd}": ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[ingest] FAILED: "${label}" exited with code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

if (isMac) {
  // macOS: system pip is managed by Homebrew and blocks installs outside venv.
  // Auto-create .venv if it doesn't exist, then use it for everything.
  if (!existsSync(venvPython)) {
    console.log('[ingest] macOS: creating Python venv at backend/ingestion/.venv ...');
    run('python3', ['-m', 'venv', venvDir], 'Creating venv');
  }
  run(venvPython, ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt'], 'Installing Python deps (venv)');
  run(venvPython, ['ingest.py'], 'Running ingestion (ingest.py)');
} else {
  // Linux / Windows: use system Python.
  const pythonCmd = isWin ? 'python' : 'python3';
  run(pythonCmd, ['-m', 'pip', 'install', '-r', 'requirements.txt'], 'Installing Python deps');
  run(pythonCmd, ['ingest.py'], 'Running ingestion (ingest.py)');
}

console.log('[ingest] Done. Live RAG data has been ingested.');
