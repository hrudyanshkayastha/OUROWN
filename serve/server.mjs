// Static server for the mirrored ethiack.com capture and reconstructed assets.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, 'site')
const PORT = Number(process.env.PORT || 4173)
const HOST = process.env.HOST || '127.0.0.1'
const UPSTREAM = 'https://ethiack.com'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/vnd.microsoft.icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.riv': 'application/octet-stream',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.map': 'application/json; charset=utf-8',
}

// Load mirror-manifest.json if present
const manifestPath = path.resolve(__dirname, 'mirror-manifest.json')
const manifestMap = new Map()
const hashToLocalPath = new Map()

// Index sanity-proxy files if present
const sanityProxyDir = path.join(ROOT, 'sanity-proxy')
function indexSanityFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) {
      indexSanityFiles(full)
    } else {
      hashToLocalPath.set(item, full)
    }
  }
}
indexSanityFiles(sanityProxyDir)

if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    for (const f of manifest.files || []) {
      const u = new URL(f.url, UPSTREAM)
      const pathname = decodeURIComponent(u.pathname)
      const localAbs = path.join(ROOT, ...f.path.split('/'))
      manifestMap.set(pathname, localAbs)
      manifestMap.set(u.pathname, localAbs)

      // Index sanity image hashes
      const hashMatch = pathname.match(/([a-f0-9]{40,}-[0-9]+x[0-9]+\.[a-z]+)/i)
      if (hashMatch) {
        if (!hashToLocalPath.has(hashMatch[1])) {
          hashToLocalPath.set(hashMatch[1], localAbs)
        }
      }
    }
  } catch (err) {
    console.warn('Warning: Could not parse mirror-manifest.json:', err.message)
  }
}

// Convert arbitrary URL path to safe disk path matching mirror.mjs logic
const NOT_SAFE = /[^\w.\-()]/g
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i

function safeSegment(seg) {
  let s = seg.replace(NOT_SAFE, '_').replace(/[. ]+$/, '')
  if (!s || s === '.' || s === '..') s = '_'
  if (RESERVED.test(s)) s = '_' + s
  return s.slice(0, 120)
}

function resolveDiskFile(decodedPath) {
  // 1. Direct path in ROOT
  const direct = path.resolve(ROOT, '.' + path.posix.normalize(decodedPath))
  if (direct.startsWith(ROOT + path.sep) || direct === ROOT) {
    if (fs.existsSync(direct)) {
      if (fs.statSync(direct).isFile()) return direct
    }
  }

  // 2. Extensionless route check: e.g. /hackian -> /hackian.html, /platform -> /platform.html
  const asHtml = direct + '.html'
  if (fs.existsSync(asHtml) && fs.statSync(asHtml).isFile()) return asHtml

  const asIndex = path.join(direct, 'index.html')
  if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) return asIndex

  // 3. Manifest lookup
  if (manifestMap.has(decodedPath)) {
    const p = manifestMap.get(decodedPath)
    if (fs.existsSync(p)) return p
  }

  // 4. Safe segment conversion (handles _ipx special encoding with &, colons, etc.)
  const segments = decodedPath.split('/').filter(Boolean).map(safeSegment)
  if (segments.length > 0) {
    const safePath = path.join(ROOT, ...segments)
    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) return safePath
    if (fs.existsSync(safePath + '.html')) return safePath + '.html'
  }

  // 5. Fallback for Sanity image hash if another size is available
  const hashMatch = decodedPath.match(/([a-f0-9]{40,}-[0-9]+x[0-9]+\.[a-z]+)/i)
  if (hashMatch && hashToLocalPath.has(hashMatch[1])) {
    const fallback = hashToLocalPath.get(hashMatch[1])
    if (fs.existsSync(fallback)) return fallback
  }

  return null
}

const server = http.createServer(async (req, res) => {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const rawUrl = req.url || '/'
  const cleanPath = rawUrl.split('?')[0].split('#')[0]
  const decodedPath = decodeURIComponent(cleanPath)

  let localFile = resolveDiskFile(decodedPath)

  // Dynamic upstream fetch and cache if file is missing locally
  if (!localFile && req.method === 'GET') {
    try {
      const upstreamUrl = UPSTREAM + rawUrl
      const upstreamRes = await fetch(upstreamUrl, {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      if (upstreamRes.ok) {
        const buf = Buffer.from(await upstreamRes.arrayBuffer())
        const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream'

        // Determine destination path to cache
        let dest
        if (cleanPath.startsWith('/_ipx/')) {
          const segs = decodedPath.split('/').filter(Boolean).map(safeSegment)
          dest = path.join(ROOT, ...segs)
        } else if (!path.extname(cleanPath)) {
          dest = path.join(ROOT, '.' + path.posix.normalize(decodedPath) + '.html')
        } else {
          dest = path.join(ROOT, '.' + path.posix.normalize(decodedPath))
        }

        try {
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, buf)
          localFile = dest
        } catch {
          // If write fails, stream directly
          res.writeHead(200, {
            'content-type': contentType,
            'content-length': buf.length,
            'cache-control': 'public, max-age=3600',
          })
          if (req.method === 'HEAD') { res.end(); return }
          res.end(buf)
          return
        }
      }
    } catch {
      // upstream fetch failed, continue to 404
    }
  }

  if (!localFile || !fs.existsSync(localFile)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 Not Found')
    return
  }

  const ext = path.extname(localFile).toLowerCase()
  const contentType = TYPES[ext] || 'application/octet-stream'
  const stat = fs.statSync(localFile)

  // Dynamic rewrite for HTML and payload JSON to proxy Sanity & DigitalOcean assets locally
  if (ext === '.html' || ext === '.json') {
    let content = fs.readFileSync(localFile, 'utf8')
    content = content
      .replaceAll('https://cdn.sanity.io', '/sanity-proxy')
      .replaceAll('https://burospaces1.fra1.cdn.digitaloceanspaces.com', '/media-proxy')

    const buf = Buffer.from(content, 'utf8')
    res.writeHead(200, {
      'content-type': contentType,
      'content-length': buf.length,
      'cache-control': 'no-cache',
    })
    if (req.method === 'HEAD') { res.end(); return }
    res.end(buf)
    return
  }

  // Support Range requests for media (critical for video playback & seeking)
  const range = req.headers.range
  if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mov')) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1

    if (start >= stat.size || end >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
      res.end()
      return
    }

    const chunksize = end - start + 1
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    })

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    const stream = fs.createReadStream(localFile, { start, end })
    stream.pipe(res)
    return
  }

  res.writeHead(200, {
    'content-type': contentType,
    'content-length': stat.size,
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=31536000, immutable',
  })

  if (req.method === 'HEAD') {
    res.end()
    return
  }

  const stream = fs.createReadStream(localFile)
  stream.pipe(res)
})

server.listen(PORT, HOST, () => {
  console.log(`Ethiack local server running at http://${HOST}:${PORT}/`)
  console.log(`Serving mirrored root: ${ROOT}`)
})