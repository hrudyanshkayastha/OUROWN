# Ethiack Website — Exact Faithful Reconstruction

This repository contains the exact, faithful reconstruction of the [Ethiack](https://ethiack.com/) website, restored from recovered source files, bundles, and assets.

## Project Structure

```
ethiack/
├── app/                  # Original recovered Nuxt/Vue source components and projections
├── bundles/              # Exported production bundle artifacts and manifest
├── evidence/             # Recovery audit and inspection evidence
├── graph/                # Dependency and module graph
├── serve/
│   ├── server.mjs        # Production-grade static and media streaming server
│   ├── mirror-manifest.json # Asset registry (409 mirrored core assets)
│   └── site/             # Prerendered site with 67 routes, CSS, JS, fonts, and media
│       ├── _nuxt/        # Compiled CSS, JS modules, chunks, and build metadata
│       ├── _ipx/         # Optimized WebP assets
│       ├── fonts/        # Full original FK Grotesk typography suite (17 fonts)
│       ├── imgs/         # Core illustrations and header graphics
│       ├── media-proxy/  # DigitalOcean Spaces background CRT canvas video loops
│       ├── sanity-proxy/ # Complete suite of Sanity SVG vectors, Rive files, and media
│       ├── platform/     # All Platform subpages and payloads
│       ├── use-cases/    # All Use Cases subpages and payloads
│       ├── info-hub/     # Case studies, research papers, and blog pages
│       ├── legal/        # Terms of service, privacy, and security policies
│       └── sitemap/      # Complete site index
├── test/
│   ├── verify_site.mjs   # Automated route and HTTP Range verification suite
│   ├── browser_verify.cjs# Playwright automated browser test across 4 viewports
│   └── screenshots/      # High-resolution screenshots of local vs reference
└── package.json          # Project configuration with npm start and npm test
```

## How to Run Locally

### Start Development Server
```sh
npm start
```
Or directly:
```sh
node serve/server.mjs
```
The site will be available at: **http://127.0.0.1:4173/**

### Run Automated Verification Suite
```sh
npm test
```

## Features & Verification Highlights

1. **Exact Visual Reproduction**: No redesign or substitution. Preserves the authentic CRT matrix scanlines, animated vulnerability tags ("XSS IN API", "CVE-2025-55182", "LEAKED CREDENTIALS DETECTED", "RCE IN API"), floating navigation dock, and interactive `Console.log` side drawer.
2. **Typography Restored**: Complete suite of 17 FK Grotesk font weights (Light, Regular, Medium, Mono, Display, Raster Blended, Raster Rounded) served locally in `woff2` and `woff` formats.
3. **CRT Canvas Background**: Full streaming video support with HTTP Range requests (`206 Partial Content`) for the interactive matrix building background video loops.
4. **Vector Assets & Rive Animations**: All 49 Sanity SVG vector logos and Rive animation files (`.riv`) downloaded and served with universal CORS compatibility.
5. **Multi-Viewport Responsive Fidelity**: Tested and verified across Mobile (390px), Tablet (768px), Laptop (1366px), and Desktop (1920px).
