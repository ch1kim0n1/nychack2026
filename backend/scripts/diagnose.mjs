/**
 * Backend live-API diagnostic. Captures the REAL server-side error behind 500s.
 *
 * Usage (from backend/):  node scripts/diagnose.mjs
 *
 * It builds, boots the server on a private port capturing all stdout/stderr,
 * hits every live endpoint, and prints HTTP codes + the server stack traces.
 * Paste the full output into issue #1.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;
const root = path.resolve(import.meta.dirname, '..');

function section(t) { console.log(`\n===== ${t} =====`); }

// 1. Environment
section('ENVIRONMENT');
console.log('node', process.version);
console.log('cwd', process.cwd());
const envPath = path.join(root, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  const key = /OPENAI_API_KEY\s*=\s*"?([^"\n]*)"?/.exec(env)?.[1] ?? '';
  const db = /DATABASE_URL\s*=\s*"?([^"\n]*)"?/.exec(env)?.[1] ?? '';
  console.log('OPENAI_API_KEY:', key ? `present (len ${key.length}, prefix ${key.slice(0, 6)})` : 'MISSING/EMPTY');
  console.log('DATABASE_URL host:', (/@([^/:]+)/.exec(db)?.[1]) ?? '(unparseable)');
} else {
  console.log('.env MISSING at', envPath);
}

// 2. Prisma client generated?
section('PRISMA CLIENT');
const clientDts = path.join(root, 'node_modules/.prisma/client/index.d.ts');
if (existsSync(clientDts)) {
  const d = readFileSync(clientDts, 'utf8');
  console.log('generated:', 'yes');
  console.log('has RiskFinding model:', d.includes('RiskFinding'));
  console.log('has RagQueryLog model:', d.includes('RagQueryLog'));
} else {
  console.log('NOT generated — run `npx prisma generate`');
}

// 3. Build fresh
section('BUILD (npm run build:prod)');
const build = spawnSync('npm', ['run', 'build:prod'], { cwd: root, shell: true, encoding: 'utf8' });
console.log((build.stdout || '').split('\n').slice(-3).join('\n'));
if (build.status !== 0) { console.log('BUILD FAILED:', build.stderr); process.exit(1); }

// 4. Boot, capturing all output
section('BOOT');
let log = '';
const srv = spawn('node', ['dist/main.js'], { cwd: root, env: { ...process.env, PORT: String(PORT) } });
srv.stdout.on('data', d => { log += d; });
srv.stderr.on('data', d => { log += d; });

function req(method, p, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(`${BASE}${p}`, {
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {},
    }, (res) => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ code: res.statusCode, body: b.slice(0, 300) }));
    });
    r.on('error', e => resolve({ code: 'ERR', body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

const ready = () => new Promise((res) => {
  const t = setInterval(() => { if (log.includes('CivicLens API') || log.includes('Nest application successfully started')) { clearInterval(t); res(true); } }, 300);
  setTimeout(() => { clearInterval(t); res(false); }, 30000);
});

await ready();

section('ENDPOINT PROBES');
const probes = [
  ['POST', '/api/profile/classify', { input: 'food truck in Dallas to Austin' }],
  ['POST', '/api/risk/analyze', { profile: { industry: 'food_service', location: 'Austin, TX', expansion_locations: [], activities: [], employees: 1 } }],
  ['GET', '/api/metrics/citation-coverage'],
  ['GET', '/api/metrics/rag-stats'],
  ['GET', '/api/risk/demo'],
  ['GET', '/api/diff/scenario-a'],
];
for (const [m, p, b] of probes) {
  const r = await req(m, p, b);
  console.log(`${m} ${p} -> ${r.code}  ${r.code >= 400 || r.code === 'ERR' ? r.body : ''}`);
}

section('FULL SERVER LOG');
console.log(log);

srv.kill();
process.exit(0);
