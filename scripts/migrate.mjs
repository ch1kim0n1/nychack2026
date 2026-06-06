// scripts/migrate.mjs
// Apply Prisma migrations against the running Postgres instance.
// Runs `npx prisma migrate deploy` from the backend/ workspace so it
// picks up backend/.env and backend/prisma/schema.prisma.
// ASCII-only output (Windows cp1252-safe).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..', 'backend');

console.log('[migrate] Applying Prisma migrations (prisma migrate deploy)...');

// shell:true lets `npx` resolve correctly on Windows (npx.cmd) and *nix.
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error(
    `[migrate] FAILED: prisma migrate deploy exited with code ${result.status}.`,
  );
  console.error(
    '[migrate] Is the database up? Try: npm run db:up  (and check backend/.env DATABASE_URL).',
  );
  process.exit(result.status ?? 1);
}

console.log('[migrate] Migrations applied.');
