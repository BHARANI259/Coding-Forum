# KEC Coding Forum Security Baseline and Threat Model

## Scope

This document records the current production-security posture after the Block 7 hardening pass. It is not a penetration-test certificate. It is a practical baseline for deployment review, future security testing, and college handover.

## Existing Controls

- Spring Security protects all backend routes except login, health, public event poster files, CORS preflight, and the notification WebSocket endpoint.
- JWT access tokens are signed with the configured `JWT_SECRET` and checked on protected API requests.
- Passwords are hashed with BCrypt through Spring Security `PasswordEncoder`.
- Backend errors use a shared JSON shape and do not return stack traces for unexpected exceptions.
- CORS is environment-driven through `FRONTEND_ORIGIN` and does not use wildcard origins.
- CSRF is disabled because the current API uses bearer-token authentication, not cookie sessions.
- Role-specific APIs exist for Student, Faculty, and SuperAdmin flows.
- Event poster uploads and post-event media uploads validate file type, extension, size, and storage path.
- Protected post-event media is served through authenticated endpoints.
- PWA service worker excludes API/auth/protected routes from caching.
- Web Push VAPID private key, mail password, database password, and JWT secret are externalized through environment variables.

## New Hardening Added

- Backend security response headers through `SecurityHeadersFilter`.
- Frontend security response headers through Next.js `headers()`.
- CSP staged in report-only mode on frontend and backend responses.
- API `Cache-Control: no-store` for backend `/api/**` responses.
- Login and password-change throttling through `ApiRateLimitFilter`.
- CORS now exposes only `Content-Disposition`, restricts request headers, and caches preflight results.
- Spreadsheet import size limit added for student import, faculty import, and round marks import.
- Automated unit test added for login rate limiting.

## Critical Findings

- None intentionally left unresolved in the code paths inspected during this block.

## High-Risk Findings

- Access tokens are still stored in browser `localStorage`. This preserves the current auth architecture, but it remains exposed if a future XSS bug is introduced. Recommended migration: HttpOnly Secure refresh cookie plus short-lived access token.
- No full external DAST or manual penetration test was run in this block. Run OWASP ZAP baseline and manual IDOR checks against a staging deployment before production sign-off.
- `npm audit --omit=dev` reports high-severity advisories under Next's transitive `postcss` and `sharp` dependencies; npm's suggested fix is breaking and unsafe. Track upstream Next remediation instead of force-downgrading.

## Medium-Risk Findings

- Rate limiting is in-memory per application instance. It is useful for one Render instance but should move to Redis or gateway/WAF limits for multi-instance production.
- CSP is report-only and still allows `unsafe-inline` and `unsafe-eval` for Next.js compatibility. Enforce only after reviewing violation reports and moving toward nonces/hashes where possible.
- JWTs do not currently include issuer, audience, or token-version/security-version checks.
- No refresh-token rotation model is present in the inspected code despite earlier architectural requirements mentioning refresh tokens.
- WebSocket authentication currently uses the existing token-based handshake design; native browser WebSocket headers are limited, so token exposure must be reviewed in deployment logs.
- Account deactivation and role-change immediate token invalidation require further review.

## Low-Risk / Informational Findings

- HSTS was not added in application code because it should be enforced only on HTTPS domains after confirming subdomain policy.
- Actuator is not present in the dependency tree, so there are no actuator endpoints to expose by default.
- Maven dependency tree succeeded, but no OWASP dependency-check plugin is configured.
- No real secrets were found in source by a targeted `rg` scan; only placeholders and documentation examples were found.

## Threat Model

### Assets

- Student, Faculty, and SuperAdmin accounts
- Password hashes and login state
- JWT access tokens
- Student profile and registration data
- Team membership and team codes
- Event setup, problem statements, rounds, and incharges
- Result declarations, student points, leaderboards, reports, and analytics
- Uploaded posters and post-event media
- Push subscriptions, VAPID private key, SMTP credentials, and database credentials

### Potential Attackers

- Unauthenticated internet user
- Authenticated Student attempting cross-user access
- Authenticated Faculty attempting unassigned event access
- Compromised Student or Faculty account
- Malicious file uploader
- Automated login bot
- Shared-computer user
- Network attacker between browser and deployment
- User attempting IDOR by changing IDs in URLs or request bodies

### Primary Attack Surfaces

- `/api/auth/**` login and password-change endpoints
- Student registration and team APIs
- Faculty round/result publish APIs
- SuperAdmin user/event/incharge/problem/report APIs
- File upload and download endpoints
- Public event poster endpoint
- WebSocket `/ws`
- Web Push subscription APIs
- PWA service worker and browser storage
- CSV/XLSX import endpoints

### Trust Boundaries

- Browser and installed PWA shell
- Next.js frontend deployment
- Spring Boot API deployment
- PostgreSQL database
- Local upload storage
- SMTP provider
- Web Push provider
- Reverse proxy/CDN/deployment platform

## API Security Matrix

| Area | Authentication | Authorization | Cache Policy | Rate Limit | Notes |
| --- | --- | --- | --- | --- | --- |
| Auth login | Public | Portal-specific role check after credential validation | No-store via API headers | Yes | Generic invalid credential messages remain important |
| Change password | Required | Current user only | No-store | Yes | Existing session-token revocation is not implemented |
| Student APIs | Required | Student role and service ownership checks | No-store | Not global | Continue IDOR testing for event/team/registration IDs |
| Faculty APIs | Required | Faculty role plus assigned-event checks | No-store | Not global | Unassigned event access must be manually regression-tested |
| Admin APIs | Required | SuperAdmin role | No-store | Not global | High-impact actions should be audited later |
| Reports/downloads | Required | Admin or assigned faculty depending endpoint | No-store | Not global | `Content-Disposition` is exposed for frontend downloads |
| Public posters | Public | File name constrained by service | Browser cache allowed | No | Promotional images only, not post-event private media |
| Protected media | Required | Admin or assigned faculty/owner | No-store | Not global | Uses metadata lookup and stored file name |
| WebSocket | Token required by handler | User session mapping | N/A | Not added | Avoid logging token-bearing handshake data |
| Web Push | Required | User-owned subscriptions | No-store | Not global | VAPID private key is environment-only |

## Manual Verification Required Before Final Production

- Attempt Student access to `/api/admin/**` and `/api/faculty/**`.
- Attempt Faculty access to unassigned event result and media endpoints.
- Attempt cross-user notification and push-subscription access.
- Attempt registration/team ID tampering.
- Upload renamed executable, oversized file, SVG, fake MIME type, and malformed images.
- Import oversized XLSX/CSV and formula-like spreadsheet cells.
- Run ZAP baseline against a staging URL.
- Review CSP report-only violations in browser console and deployment logs.
- Verify HTTPS, HSTS, and WSS behavior on final domains.
