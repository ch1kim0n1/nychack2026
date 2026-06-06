/**
 * Citation URL validator — item 2.5
 * Checks every source_url across:
 *   - ingestion/sources.json
 *   - prisma/seed.ts (extracted inline)
 *   - src/diff/scenarios/*.json
 *
 * Run: npx ts-node scripts/validate-citations.ts
 *
 * A URL is valid if the HTTP response is < 400.
 * Prints a summary table and exits with code 1 if any URL is broken.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

interface Result {
  url: string
  source: string
  status: number | 'ERROR'
  ok: boolean
  note?: string
}

// TLS errors that indicate an incomplete cert chain served by the host
// (e.g. a missing intermediate / self-signed-intermediate) rather than a
// dead host or an invalid/expired/mismatched certificate. Some authoritative
// government sites (e.g. dallascityhall.com) serve a leaf cert without the
// intermediate, which Node rejects even though the page is live and trusted
// by browsers that fetch the missing intermediate via AIA. We treat these as
// recoverable and re-verify the HTTP response, but never blanket-disable TLS.
const RECOVERABLE_TLS_ERRORS = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
])

async function checkUrl(
  url: string,
  insecure = false,
): Promise<{ status: number | 'ERROR'; ok: boolean; note?: string }> {
  return new Promise(resolve => {
    const isHttps = url.startsWith('https')
    const mod = isHttps ? https : http
    const options: https.RequestOptions = {
      headers: { 'User-Agent': 'CivicLens/citation-validator 1.0' },
    }
    // Scoped, opt-in only: used on a single retry when the host returned a
    // recoverable cert-chain error, so we can still confirm it responds < 400.
    if (insecure && isHttps) options.rejectUnauthorized = false

    const req = mod.get(url, options, res => {
      const status = res.statusCode ?? 0
      res.resume() // drain body
      const tlsNote = insecure ? ' (host TLS chain incomplete; verified via response)' : ''
      if (status >= 300 && status < 400 && res.headers.location) {
        resolve({ status, ok: true, note: `redirects → ${res.headers.location}${tlsNote}` })
      } else {
        resolve({ status, ok: status < 400, note: tlsNote ? tlsNote.trim() : undefined })
      }
    })
    req.on('error', (err: NodeJS.ErrnoException) => {
      const code = (err as { code?: string }).code ?? ''
      // Retry exactly once for an incomplete-chain TLS error, still requiring
      // a live HTTP response < 400. 404s / dead hosts stay broken.
      if (!insecure && isHttps && RECOVERABLE_TLS_ERRORS.has(code)) {
        resolve(checkUrl(url, true))
      } else {
        resolve({ status: 'ERROR', ok: false, note: err.message })
      }
    })
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 'ERROR', ok: false, note: 'timeout' }) })
  })
}

function collectUrls(): Array<{ url: string; source: string }> {
  const urls: Array<{ url: string; source: string }> = []
  const root = path.join(__dirname, '..')

  // ingestion/sources.json
  const sourcesJson = JSON.parse(fs.readFileSync(path.join(root, 'ingestion/sources.json'), 'utf-8'))
  for (const s of sourcesJson) {
    urls.push({ url: s.url, source: 'ingestion/sources.json' })
  }

  // diff scenarios
  const scenariosDir = path.join(root, 'src/diff/scenarios')
  for (const file of fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json'))) {
    const scenario = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf-8'))
    for (const diff of scenario.differences ?? []) {
      if (diff.source_a) urls.push({ url: diff.source_a, source: file })
      if (diff.source_b) urls.push({ url: diff.source_b, source: file })
    }
  }

  // seed.ts — extract URLs via regex (avoid importing Prisma)
  const seedContent = fs.readFileSync(path.join(root, 'prisma/seed.ts'), 'utf-8')
  const urlPattern = /source_url:\s*['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = urlPattern.exec(seedContent)) !== null) {
    urls.push({ url: match[1], source: 'prisma/seed.ts' })
  }

  // deduplicate by URL
  const seen = new Set<string>()
  return urls.filter(u => {
    if (seen.has(u.url)) return false
    seen.add(u.url)
    return true
  })
}

async function main() {
  const urls = collectUrls()
  console.log(`\nChecking ${urls.length} unique citation URLs...\n`)

  const results: Result[] = []
  for (const { url, source } of urls) {
    process.stdout.write(`  ${url.slice(0, 60).padEnd(62)} `)
    const { status, ok, note } = await checkUrl(url)
    results.push({ url, source, status, ok, note })
    console.log(ok ? `✓ ${status}${note ? '  ' + note : ''}` : `✗ ${status}${note ? '  ' + note : ''}`)
  }

  const passed = results.filter(r => r.ok)
  const failed = results.filter(r => !r.ok)

  console.log(`\n─────────────────────────────────────────`)
  console.log(`✓ Valid:  ${passed.length}`)
  console.log(`✗ Broken: ${failed.length}`)
  console.log(`Coverage: ${Math.round((passed.length / results.length) * 100)}%`)

  if (failed.length > 0) {
    console.log('\nBroken URLs:')
    for (const r of failed) {
      console.log(`  [${r.source}] ${r.url}  →  ${r.status}${r.note ? ' (' + r.note + ')' : ''}`)
    }
    process.exit(1)
  } else {
    console.log('\nAll citations valid. ✓')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
