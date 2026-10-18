// Mirror the delivered ethiack.com pages and first-party assets for local serving.
// Reads only public URLs the target already serves to any visitor.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ORIGIN = 'https://ethiack.com'
const OUT = 'F:\\ethiack-recovered\\serve\\site'
const CONCURRENCY = 6

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36'

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  const buf = Buffer.from(await res.arrayBuffer())
  return { res, buf }
}

// Keep an allowlist so Nuxt's _ipx proxy paths, which embed a whole source URL in
// the segment, stay inside the mirror root without mangling ordinary filenames.
const NOT_SAFE = /[^\w.\-()]/g
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i

function safeSegment(seg) {
  let s = seg.replace(NOT_SAFE, '_').replace(/[. ]+$/, '')
  if (!s || s === '.' || s === '..') s = '_'
  if (RESERVED.test(s)) s = '_' + s
  return s.slice(0, 120)
}

function localPathFor(url) {
  const u = new URL(url)
  if (u.origin !== ORIGIN) return null
  let p = decodeURIComponent(u.pathname)
  if (p.endsWith('/')) p += 'index.html'
  const segments = p.split('/').filter(Boolean).map(safeSegment)
  if (segments.length === 0) segments.push('index.html')
  const last = segments[segments.length - 1]
  if (!path.extname(last)) segments[segments.length - 1] = last + '.html'
  return path.join(OUT, ...segments)
}

const seen = new Set()
const queue = [`${ORIGIN}/`]
const downloaded = []

async function worker() {
  for (;;) {
    const url = queue.shift()
    if (!url) return
    if (seen.has(url)) continue
    seen.add(url)

    let res, buf
    try {
      ;({ res, buf } = await get(url))
    } catch (err) {
      console.error('FAIL', url, err.message)
      continue
    }
    if (!res.ok) {
      console.error(res.status, url)
      continue
    }

    const type = res.headers.get('content-type') || 'application/octet-stream'
    const dest = localPathFor(url)
    if (dest) {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, buf)
      downloaded.push({
        url,
        path: path.relative(OUT, dest).split(path.sep).join('/'),
        bytes: buf.length,
        contentType: type.split(';')[0].trim(),
        sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      })
    }

    if (type.includes('text/html')) {
      const html = buf.toString('utf8')
      const found = new Set()
      for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) found.add(m[1])
      for (const p of found) {
        const abs = new URL(p, ORIGIN).href
        if (!seen.has(abs) && !queue.includes(abs)) queue.push(abs)
      }
    }

    if (type.includes('text/css')) {
      const css = buf.toString('utf8')
      for (const m of css.matchAll(/url\(["']?(\/[^)"']+\.(?:woff2?|ttf|otf|png|jpg|jpeg|svg|gif|webp))["']?\)/gi)) {
        const abs = new URL(m[1], ORIGIN).href
        if (!seen.has(abs) && !queue.includes(abs)) queue.push(abs)
      }
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

fs.writeFileSync(
  'F:\\ethiack-recovered\\serve\\mirror-manifest.json',
  JSON.stringify(
    { origin: ORIGIN, capturedAt: new Date().toISOString(), count: downloaded.length, files: downloaded },
    null,
    1
  )
)

console.log('downloaded', downloaded.length, 'first-party files')
const byType = {}
for (const d of downloaded) byType[d.contentType] = (byType[d.contentType] || 0) + 1
console.log(byType)
console.log('total bytes', downloaded.reduce((n, d) => n + d.bytes, 0))