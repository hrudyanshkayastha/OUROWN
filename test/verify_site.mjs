import http from 'node:http'

const BASE = 'http://127.0.0.1:4173'

const testUrls = [
  { url: '/', expectType: 'text/html' },
  { url: '/hackian', expectType: 'text/html' },
  { url: '/platform', expectType: 'text/html' },
  { url: '/platform/attack-surface-management', expectType: 'text/html' },
  { url: '/platform/agentic-pentest-as-a-service', expectType: 'text/html' },
  { url: '/use-cases', expectType: 'text/html' },
  { url: '/use-cases/manufacturing', expectType: 'text/html' },
  { url: '/info-hub', expectType: 'text/html' },
  { url: '/legal/terms-of-service', expectType: 'text/html' },
  { url: '/sitemap', expectType: 'text/html' },
  { url: '/_nuxt/entry.BqUG4Qle.css', expectType: 'text/css' },
  { url: '/_payload.json?9c6ca34a-56fa-46a2-a1cb-1cabdefd3d67', expectType: 'application/json' },
  { url: '/fonts/FKGrotesk-Regular.woff2', expectType: 'font/woff2' },
  { url: '/fonts/FKGrotesk-Light.woff2', expectType: 'font/woff2' },
  { url: '/fonts/FKDisplay-RegularAlt.woff2', expectType: 'font/woff2' },
  { url: '/imgs/findings.svg', expectType: 'image/svg+xml' },
  { url: '/imgs/header_platform.jpg', expectType: 'image/jpeg' },
  { url: '/scripts/gtagv2.js', expectType: 'text/javascript' },
  { url: '/media-proxy/ethiack/2026-08-04T09-17-31.590Z-2026-06-29T11-26-06.102Z-ethiack-header.mp4', expectType: 'video/mp4' },
  { url: '/_ipx/f_webp&s_3400x4096/https://cdn.sanity.io/images/ah5kp358/production/bfd90eb65a612331e69cb3c991ecc9ddbfd49862-1656x1995.jpg', expectType: 'image/' }
]

async function run() {
  console.log('Testing Ethiack local server at ' + BASE + ' ...\n')
  let passed = 0
  let failed = 0

  for (const t of testUrls) {
    try {
      const res = await fetch(BASE + t.url)
      const ctype = res.headers.get('content-type') || ''
      const ok = res.status === 200 && ctype.includes(t.expectType)
      if (ok) {
        console.log(`[PASS] ${t.url} -> ${res.status} (${ctype})`)
        passed++
      } else {
        console.error(`[FAIL] ${t.url} -> ${res.status} (expected ${t.expectType}, got ${ctype})`)
        failed++
      }
    } catch (e) {
      console.error(`[ERROR] ${t.url} -> ${e.message}`)
      failed++
    }
  }

  // Also test Range request on video
  try {
    const res = await fetch(BASE + '/media-proxy/ethiack/2026-08-04T09-17-31.590Z-2026-06-29T11-26-06.102Z-ethiack-header.mp4', {
      headers: { 'Range': 'bytes=0-1023' }
    })
    const ctype = res.headers.get('content-type') || ''
    const crange = res.headers.get('content-range') || ''
    if (res.status === 206 && crange.includes('bytes 0-1023/') && ctype === 'video/mp4') {
      console.log(`[PASS] Video Range Request -> 206 Partial Content (Content-Range: ${crange})`)
      passed++
    } else {
      console.error(`[FAIL] Video Range Request -> ${res.status} (expected 206, got ${res.status})`)
      failed++
    }
  } catch (e) {
    console.error(`[ERROR] Video Range Request -> ${e.message}`)
    failed++
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`)
  if (failed > 0) process.exit(1)
}

run()
