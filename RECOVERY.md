# ethiack.com — passive recovery via REA

Target: `https://ethiack.com/` · Date: 2026-10-15 · Tool: [REA](https://github.com/morluto/rea) v6.5.0 (`F:\rea`, built from source)

All observations below come from REA CLI operations against a **dedicated, user-owned
Chrome profile started with `--remote-debugging-port=9222`**. REA never launched, drove,
evaluated, or mutated the page — every capture is attach-only.

## What is in this directory

| Path | Contents |
| --- | --- |
| `app/` | 71 original source files recovered from the site's own published `.js.map` files |
| `third-party/` | 7 vendor files that shipped inside those source maps (GSAP, Rive, Nuxt, `@nuxtjs/device`) |
| `bundles/` | 78 built bundles exported by `rea export-web-scripts`, plus REA's verified `manifest.json` |
| `graph/` | `module-graph.json` (866 nodes / 2907 edges, trimmed), `analysis-summary.json`, `app-module-map.txt` |
| `evidence/` | The raw REA Evidence records backing every claim |
| `MANIFEST.sha256` | SHA-256 of all 163 files above |

## Commands run

```sh
git clone https://github.com/morluto/rea.git && npm ci && npm run build:cached
# Windows source checkout also needs the packaged addon (documented recovery step):
npm pack rea-agents@6.5.0
# -> native/windows/build/manifest.json + rea-windows-x64.node

node scripts/rea.mjs list-browser-targets http://127.0.0.1:9222 --allowed-origins https://ethiack.com
node scripts/rea.mjs inspect-web-page        http://127.0.0.1:9222 <target> --observation-ms 12000 \
    --include-accessibility-text --include-console-text --include-json-body-shapes \
    --include-websocket-shapes --include-storage-keys --include-storage-fingerprints
node scripts/rea.mjs analyze-web-bundle      http://127.0.0.1:9222 <target> --fetch-source-maps
node scripts/rea.mjs export-web-scripts      capture.json bundles/
node scripts/rea.mjs analyze-javascript-application bundles/files
```

## Evidence identifiers

| Operation | Evidence ID | Record |
| --- | --- | --- |
| `list_browser_targets` | `ev_3f787d6be9540cb4f680e79cd7f73e2243b006ecb9027e249bd91a31f371c020` | `evidence/list-browser-targets.json` |
| `inspect_web_page` (first pass) | `ev_3f787d6b…` family — see file | `evidence/capture-inspect-web-page.json` (`ev_1be8f005829f1f19c702406603439f7dff5ae832596d6855023a10ed92e6bcaf`) |
| `analyze_web_bundle` | see file | `evidence/capture-analyze-web-bundle.json` |
| `export_web_scripts` | `ev_7d9c2a480d4b8fec91762f71f3ad3bc327423339414c747e1d90f0f8416eeaa0` | `bundles/manifest.json` |
| `analyze_javascript_application` | `ev_8234e923ed5e28725dae773ef9782536648cf8ea7a70ad575fce757ffce69453` | `graph/` |

## Recovered stack

- **Nuxt 3 / Vue 3 / Vite**, SSR-prerendered, SCSS. Detected by REA's `vite-runtime` and
  `vue-runtime` detectors (confidence: medium).
- **Sanity** headless CMS as the data layer, queried through GROQ projections
  (`app/sanity/projections/`). Content model: `page.home` document with an ordered
  `sections[]` array, plus `sharedContent` (footer/pre-footer) and `settings`
  (global metadata + `organizationSchema`).
- **GSAP** for all motion — `ScrollTrigger`, `Draggable`, `InertiaPlugin`, `matchMedia`,
  `quickSetter`/`quickTo`.
- **Rive** (`@rive-app/webgl2`) for `.riv` animations, with an explicit WebGL-failure
  fallback that swaps to a static image.
- **Third parties:** Plausible, Google Tag Manager `GTM-WX3J4C7M`, HubSpot forms
  (`js-eu1.hsforms.net/forms/embed/v2.js`), Usercentrics CMP, Fontshare
  (FK Grotesk / FK Raster / FK Display), Rive WASM.
- Binary assets on DigitalOcean Spaces (`burospaces1.fra1.cdn.digitaloceanspaces.com`),
  CMS assets on `cdn.sanity.io`. Agency credit in the served HTML: BÜRO / burocratik.com.

## Composition

```
pages/index.vue            → useSanityQuery(home()) → Page → Home
components/pages/Home      → CrtCanvas wrapping:
    Header · Issue (newsletter) · Hackian · SeeTestAct · Platform · UseCases
    · PreFooter · Footer
```

Hydration is staggered by `composables/core/useHydrateStaggered.js` — 500 ms base delays in
250 ms steps, scaled by ×0.1 on desktop (`useDevice().isDesktop`) and ×1.0 on mobile.
`Home.vue` dispatches a `hydration-ready` event on the injected `pageContext` loader after
the last section's delay.

## Findings worth attention

1. **Production source maps are publicly served.** 58 of 59 captured chunks return a
   `.js.map` with complete `sourcesContent`. `analyze-web-bundle --fetch-source-maps`
   processed all 58, yielding every original source file in `app/` — application code, GROQ
   queries and vendor sources alike, with no obfuscation.
2. **The prerendered route table ships to the client.** REA recovered 82 routes from the
   router chunk, including every blog slug, `/platform/:slug()`, `/use-cases/:slug()`,
   `/info-hub/:category()/:slug()`, `/legal/:slug()`, `/hackian`, `/ethibench` and
   `/research/cve-2026-66066`.
3. **Build and payload metadata are public:** `/_nuxt/builds/meta/<buildId>.json` and
   `/_payload.json?<buildId>` are linked from the document.
4. **Developer tooling is present in the production bundle:** a red-overlay
   `[data-component=grid]` debug component, and a `consoleSnippet` field in the GROQ
   projections that `composables/useSectionLookup.js` serializes into `data-console-snippet`
   attributes on rendered elements. The capability ships; it was not populated on the home
   page as rendered.
5. **`pages/index.vue` sets `definePageMeta({ robots: 'noindex, nofollow' })`** on the
   homepage of a site that also publishes `/sitemap` and `/info-hub/feed.xml`.
6. **No client-side API surface was found** on this route: REA reported 0 endpoint
   candidates that survived as URLs (only low-confidence WebGL/ARIA string matches), 0
   WebSocket connections, and 0 WebMCP declarations.

## Coverage and limitations

These bound what this recovery proves. They are not hedges.

- **Network coverage is `attach_limited`.** REA attaches after Chrome has already begun
  loading, and Chrome never replays past requests. Only 6 requests were observed. Runtime
  endpoints and third-party beacons are therefore **unknown, not absent**. Capturing them
  requires either a slower page load or `observe-web-session` around a user-initiated
  reload.
- **Source maps: 58 requested, 58 processed, status `partial`** (one map lacked
  `sourcesContent`). Chunks not reachable from the homepage — `CrtCanvas`, `Page`, the
  navbar, CTA buttons, transitions, `useHubspot` — were referenced but never loaded, so
  their source is unrecovered. Recovering them means re-running the capture on other routes.
- **`analyze-web-bundle` completeness is `partial`**: 59 scripts parsed, 0 parse failures,
  524,097 AST nodes visited.
- **`analyze-javascript-application` completeness is `partial`**: 78 files parsed, 0 parse
  failures, 562,705 AST nodes visited, 2,750 findings. It resolves ordinary relative
  modules inside the exported container only — it does not implement browser import maps,
  root-relative URL loading, remote imports, or runtime behaviour, so unresolved
  dependencies remain explicit unknowns.
- REA never executed captured JavaScript, and source maps were fetched read-only with
  exact-origin redirect checks, no credentials, cookies, or referrer.
- Recovered code is the property of Ethiack and its vendors. GSAP carries its own
  commercial licence and `@rive-app/webgl2` and Nuxt ship under their own terms — see
  `third-party/`. This material was obtained from URLs the target serves to every visitor.

## Reproducing

```sh
node scripts/rea.mjs analyze-web-bundle http://127.0.0.1:9222 <target> --fetch-source-maps --json > bundle.json
# then extract observations.source_maps.items[].artifact.text,
# parse each source map, and write sources[i] from sourcesContent[i]
```

`verify:browser`, `verify:browser:scripts` and `verify:browser:source-maps` in the REA
checkout are the maintainers' real-browser verification lanes for these code paths.