# Block 6 - Mobile Performance, PWA Reliability and Usability Cleanup

## Scope

This pass focused on safe, measurable optimizations that do not change authentication, role permissions, backend API contracts, registration logic, result publishing logic, reports, or notifications business rules.

## Baseline Environment

- OS/runtime used: Windows PowerShell in the local project workspace.
- Frontend production build command: `npm run build`.
- Backend validation commands: `./mvnw clean compile -DskipTests`, `./mvnw test`.
- Production frontend server was briefly started with `npm run start` for manifest and service-worker header validation.

## Baseline Build Results

Baseline production build passed before optimization.

Important baseline sizes:

- Shared first-load JS: `102 kB`.
- `/admin/analytics`: `126 kB` route size, `242 kB` first-load JS.
- Most other role routes: roughly `119-130 kB` first-load JS.

## Bottlenecks Identified

- `recharts` was imported directly by `/admin/analytics`, making that admin route far larger than other routes.
- The production service worker cached safe static files but did not enforce an explicit runtime cache entry limit.
- The central API helper did not have bounded request timeouts.
- Duplicate identical GET requests could run concurrently.
- `sw.js`, PWA manifest, and icon HTTP cache policies needed to be explicit and route-appropriate.
- Backend JSON/text responses did not have compression configured.
- A production `console.info` remained in the PWA install provider.
- `npm audit --omit=dev` reported high-severity advisories through the Next/PostCSS/Sharp chain.

## Files Created

- `client/components/analytics/AdminAnalyticsCharts.tsx`
- `BLOCK_6_MOBILE_PERFORMANCE_PWA_RELIABILITY_SUMMARY.md`

## Files Modified

- `client/app/admin/analytics/page.tsx`
- `client/lib/api.ts`
- `client/next.config.js`
- `client/package.json`
- `client/package-lock.json`
- `client/public/sw.js`
- `client/components/pwa/pwa-install-provider.tsx`
- `server/src/main/resources/application.yml`
- `server/.env.example`

## Frontend Optimizations Applied

- Moved Recharts imports out of the admin analytics page into lazy-loaded chart components.
- Added chart skeleton fallback while the lazy chunk loads.
- Added optional bundle analyzer support with `ANALYZE=true`.
- Added bounded in-flight deduplication for identical plain GET requests only.
- Added request timeouts:
  - GET: `20s`
  - Mutations: `60s`
  - Downloads: `120s`
- Preserved mutation safety: registration, uploads, imports, deletes, password changes, and publish actions are not deduplicated or auto-retried.
- Removed a non-essential production install success console log.
- Updated Next.js from `15.5.19` to `15.5.22`.

## Service Worker and PWA Reliability

- Added `MAX_STATIC_CACHE_ENTRIES = 140` and runtime cache trimming.
- Added `NAVIGATION_TIMEOUT_MS = 10000` for network-first navigation fallback.
- Continued excluding API/auth/protected routes from service-worker caching.
- Continued excluding cross-origin, failed, private, no-store, and cookie-setting responses.
- Preserved offline fallback and push notification click handling.
- Verified production responses:
  - `/manifest.webmanifest`: `200`, `application/manifest+json`, `Cache-Control: public, max-age=3600, must-revalidate`
  - `/sw.js`: `200`, `application/javascript; charset=UTF-8`, `Cache-Control: no-cache, no-store, must-revalidate`

## HTTP Caching Changes

- `sw.js`: `no-cache, no-store, must-revalidate`
- `manifest.webmanifest`: `public, max-age=3600, must-revalidate`
- `/icons/*`: `public, max-age=31536000, immutable`

## Backend Optimization

- Enabled Spring Boot response compression for JSON/text-style responses above `2KB`.
- Added `SERVER_COMPRESSION_ENABLED=true` to `server/.env.example`.
- No backend API contracts or authorization rules were changed.

## Bundle Analysis

- Added `@next/bundle-analyzer` behind `ANALYZE=true`.
- Ran analyzer build successfully.
- Analyzer reports generated under:
  - `client/.next/analyze/client.html`
  - `client/.next/analyze/nodejs.html`
  - `client/.next/analyze/edge.html`

## Before and After Build Comparison

Measured production build sizes:

| Route | Before | After | Change |
| --- | ---: | ---: | ---: |
| `/admin/analytics` route size | `126 kB` | `5.62 kB` | about `95.5%` smaller |
| `/admin/analytics` first-load JS | `242 kB` | `123 kB` | about `49.2%` smaller |
| Shared first-load JS | `102 kB` | `102 kB` | no meaningful change |

The largest measured improvement is the admin analytics route because Recharts is now lazy-loaded.

## Validation Results

- Frontend TypeScript: `npm run type-check` passed.
- Frontend lint: `npm run lint` passed.
- Frontend production build: `npm run build` passed on Next `15.5.22`.
- Backend compile: `./mvnw clean compile -DskipTests` passed.
- Backend tests: `./mvnw test` passed; no tests were present to run.
- Production `next start`: started successfully and was stopped after header validation.

## Security and Audit Notes

- Service worker still does not cache authenticated API data.
- Sensitive pages and protected uploads remain excluded from service-worker caching.
- `npm audit --omit=dev` still reports 3 high-severity advisories through Next/PostCSS/Sharp even after updating to Next `15.5.22`.
- The audit tool currently suggests `npm audit fix --force` with an unsafe/breaking downgrade path, so that was intentionally not applied.

## Not Measured in This Pass

These require browser DevTools, Lighthouse, real-device testing, or longer interactive QA:

- Lighthouse mobile score.
- FCP, LCP, TBT, CLS, INP, Speed Index.
- Real cache storage entry count after extended use.
- WebSocket connection count in a live authenticated session.
- Full role-by-role regression testing on every viewport.
- Real low-end mobile device performance.
- Real Web Push delivery after deployment.

## Known Limitations

- Event poster thumbnail generation is not implemented in this pass; current poster delivery still depends on existing backend poster URLs.
- Post-event media thumbnail generation and incremental gallery pagination were not added.
- No service-worker caching was added for event posters because poster freshness/privacy rules need a backend thumbnail/versioning strategy.
- Existing pages still use some plain `<img>` tags where the source is a local background, blob URL, or backend upload endpoint.
- No backend query-plan driven index migration was added because query plans were not collected.

## Items Intentionally Deferred

- Offline event registration.
- Background sync.
- IndexedDB mutation queues.
- Full offline dashboards.
- Native Android/iOS packaging.
- Advanced observability.
- Large infrastructure migration.
- Thumbnail generation pipeline for posters/media.
- Lighthouse CI or automated performance budgets in CI.
