/**
 * End-to-end smoke test for the CivicLens live path.
 *
 * Exercises the real flow over HTTP against a running backend:
 *   demo -> intake/classify -> live analyze (RAG) -> determinism -> diff -> draft
 *
 * Repeatable and dependency-free (Node 18+ built-in fetch). Use against a
 * local instance or a deployed one:
 *   node scripts/e2e-smoke.mjs
 *   BASE_URL=https://api.example.com node scripts/e2e-smoke.mjs
 *
 * Exits non-zero on the first hard failure so it can gate CI / deploys.
 *
 * Requires (for the live-analysis steps) that the backend is connected to a
 * migrated + ingested database. Pass SKIP_LIVE=1 to check only the
 * demo/diff fallbacks when no DB is available.
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const SKIP_LIVE = process.env.SKIP_LIVE === '1';

// Scenario A — the canonical demo: food + alcohol in Dallas, expanding to Austin.
const SCENARIO_A_INTAKE =
  'I want to open a restaurant and bar in Dallas, TX and later expand to Austin. ' +
  'We will prepare food and serve alcohol. About 3 employees.';

let passed = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function req(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json };
}

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u);
const hasNullString = (obj) =>
  Object.values(obj).some((v) => v === 'null' || v === 'undefined');

async function main() {
  console.log(`\nCivicLens e2e smoke — ${BASE_URL}${SKIP_LIVE ? ' (live steps skipped)' : ''}\n`);

  // 1. Dashboard demo data (static fallback — always available)
  console.log('[1] GET /api/risk/demo');
  {
    const { status, json } = await req('GET', '/api/risk/demo');
    check('demo returns 200', status === 200, `got ${status}`);
    check('demo has findings', json?.findings?.length > 0);
    check('demo findings all carry an http(s) source_url',
      Array.isArray(json?.findings) && json.findings.every((f) => isHttpUrl(f.source_url)));
  }

  // 2. Diff scenario (drives the Compare view)
  console.log('[2] GET /api/diff/scenario-a');
  {
    const { status, json } = await req('GET', '/api/diff/scenario-a');
    check('diff returns 200', status === 200, `got ${status}`);
    check('diff returns a scenario object', json && typeof json === 'object');
  }

  if (SKIP_LIVE) {
    return finish();
  }

  // 3. Intake -> classify (free text -> structured profile)
  console.log('[3] POST /api/profile/classify');
  let profile = null;
  {
    const { status, json } = await req('POST', '/api/profile/classify', { input: SCENARIO_A_INTAKE });
    check('classify returns 2xx', status >= 200 && status < 300, `got ${status}`);
    check('classify detects food_service industry', json?.industry === 'food_service', `got ${json?.industry}`);
    check('classify detects Dallas location', /dallas/i.test(json?.location || ''), `got ${json?.location}`);
    check('classify detects Austin expansion',
      Array.isArray(json?.expansion_locations) && json.expansion_locations.some((l) => /austin/i.test(l)));
    profile = json;
  }

  // 4. Live RAG analysis on the classified profile
  console.log('[4] POST /api/risk/analyze (live RAG)');
  let firstFinding = null;
  if (profile?.industry) {
    const { status, json } = await req('POST', '/api/risk/analyze', { profile });
    check('analyze returns 2xx', status >= 200 && status < 300, `got ${status}`);
    check('analyze returns findings', json?.findings?.length > 0, `got ${json?.findings?.length ?? 0}`);
    check('every finding has a valid http(s) citation',
      Array.isArray(json?.findings) && json.findings.every((f) => isHttpUrl(f.source_url)));
    check('no schema-invalid "null"/"undefined" string values',
      Array.isArray(json?.findings) && !json.findings.some(hasNullString));
    check('risk_score is a number 0-100',
      typeof json?.risk_score === 'number' && json.risk_score >= 0 && json.risk_score <= 100);
    firstFinding = json?.findings?.[0] ?? null;
  } else {
    check('analyze reachable (classify failed, skipping)', false, 'no profile from classify');
  }

  // 5. Determinism — repeated identical requests stay within the accepted band
  console.log('[5] POST /api/risk/analyze x3 (determinism)');
  if (profile?.industry) {
    const sigs = [];
    for (let i = 0; i < 3; i++) {
      const { json } = await req('POST', '/api/risk/analyze', { profile });
      sigs.push(`${json?.risk_score}|${json?.risk_level}|${json?.findings?.length}`);
    }
    check('risk_score / risk_level / finding count are stable across runs',
      new Set(sigs).size === 1, sigs.join('  vs  '));
  }

  // 6. Draft generation from a live finding
  console.log('[6] POST /api/draft');
  if (firstFinding) {
    const { status, json } = await req('POST', '/api/draft', {
      affected_area: firstFinding.affected_area,
      explanation: firstFinding.explanation,
      recommended_action: firstFinding.recommended_action,
      source_url: firstFinding.source_url,
      business_description: SCENARIO_A_INTAKE,
      channel: 'email',
    });
    check('draft returns 2xx', status >= 200 && status < 300, `got ${status}`);
    check('draft returns non-empty content',
      !!(json && (json.body || json.content || json.subject)));
  } else {
    check('draft skipped (no live finding)', false, 'no finding to draft from');
  }

  finish();
}

function finish() {
  console.log(`\n${'-'.repeat(48)}`);
  if (failures.length === 0) {
    console.log(`PASS — ${passed} checks green`);
    process.exit(0);
  }
  console.log(`FAIL — ${failures.length} failed, ${passed} passed:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}

main().catch((err) => {
  console.error(`\nSmoke test crashed: ${err?.message || err}`);
  console.error(`Is the backend running at ${BASE_URL}?`);
  process.exit(2);
});
