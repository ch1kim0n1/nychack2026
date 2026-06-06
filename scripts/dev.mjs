// scripts/dev.mjs
// Headline one-command local dev orchestrator.
//
// Sequence:
//   1. db:up      -> start the Postgres (pgvector) container detached.
//   2. wait-for-db -> poll TCP localhost:5432 until it accepts connections
//                     (or ~30s timeout). Uses only node's built-in `net`.
//   3. migrate    -> apply Prisma migrations (prisma migrate deploy).
//   4. servers    -> run backend `start:dev` (api) + frontend `dev` (web)
//                     together via `concurrently`, killing both if either
//                     fails.
//
// Ingestion is intentionally NOT run here (it costs OpenAI + network):
// use `npm run ingest` separately.
//
// Cross-platform: child processes use { stdio: 'inherit', shell: true } so
// npm / docker / npx resolve on Windows (.cmd shims) and *nix alike.
// ASCII-only output (Windows cp1252-safe; no unicode arrows/emoji).

import { spawnSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const DB_HOST = '127.0.0.1';
const DB_PORT = 5432;
const DB_WAIT_TIMEOUT_MS = 30_000;
const DB_POLL_INTERVAL_MS = 1_000;
const DB_CONNECT_TIMEOUT_MS = 2_000;

// --- helpers -------------------------------------------------------------

// Run a command synchronously, inheriting stdio. Exits the process with a
// clear message on non-zero status so failures stop the whole sequence.
function runStep(label, cmd, args, opts = {}) {
  console.log(`[dev] ${label}...`);
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    ...opts,
  });
  if (result.error) {
    console.error(`[dev] FAILED to launch "${cmd}": ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[dev] FAILED: ${label} exited with code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

// Resolve after `ms` milliseconds (no foreground busy-wait).
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Attempt a single TCP connection; resolves true if the port accepts it.
function tryConnect(host, port, timeoutMs) {
  return new Promise((res) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      res(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

// Poll the DB port until it is open or the overall timeout elapses.
async function waitForDb() {
  console.log(
    `[dev] Waiting for Postgres on ${DB_HOST}:${DB_PORT} (timeout ${DB_WAIT_TIMEOUT_MS / 1000}s)...`,
  );
  const deadline = Date.now() + DB_WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await tryConnect(DB_HOST, DB_PORT, DB_CONNECT_TIMEOUT_MS)) {
      console.log('[dev] Postgres is accepting connections.');
      return;
    }
    await sleep(DB_POLL_INTERVAL_MS);
  }
  console.error(
    `[dev] FAILED: Postgres did not accept connections on ${DB_HOST}:${DB_PORT} within ${DB_WAIT_TIMEOUT_MS / 1000}s.`,
  );
  console.error('[dev] Check Docker is running and inspect: docker logs civiclens-db');
  process.exit(1);
}

// --- sequence ------------------------------------------------------------

async function main() {
  // 1. Bring up the database container.
  runStep(
    'Starting Postgres (docker compose up -d db)',
    'docker',
    ['compose', '-f', 'backend/docker-compose.yml', 'up', '-d', 'db'],
  );

  // 2. Wait until the DB is actually reachable before migrating.
  await waitForDb();

  // 3. Apply migrations.
  runStep('Applying migrations', 'node', ['scripts/migrate.mjs']);

  // 4. Run both servers together. concurrently is a root devDependency.
  //    --kill-others-on-fail: if api or web dies, tear the other down too.
  console.log('[dev] Starting servers: api (:3001) + web (:3000). Ctrl+C to stop.');
  const servers = spawnSync(
    'npx',
    [
      'concurrently',
      '--kill-others-on-fail',
      '--names',
      'api,web',
      '--prefix-colors',
      'cyan,magenta',
      'npm --prefix backend run start:dev',
      'npm --prefix frontend run dev',
    ],
    {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    },
  );

  // concurrently exits non-zero on Ctrl+C / a failing child; surface it but
  // do not treat a manual interrupt as a scary error.
  if (servers.status && servers.status !== 0) {
    console.error(`[dev] Servers exited with code ${servers.status}.`);
    process.exit(servers.status);
  }
}

main().catch((err) => {
  console.error(`[dev] Unexpected error: ${err && err.message ? err.message : err}`);
  process.exit(1);
});
