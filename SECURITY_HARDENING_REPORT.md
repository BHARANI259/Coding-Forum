# KEC Coding Forum - Security Hardening Report

## 1. Scope

This report documents the security protections added and the remaining recommended phases for hardening the KEC Coding Forum website.

The implemented changes focus on practical protection against common external web threats without changing the existing Student, Faculty, and SuperAdmin business flows.

## 2. Security Methods Implemented

| Protection | What Was Added | Protects Against |
| --- | --- | --- |
| URL-level role boundaries | `/api/admin/**` requires `SUPER_ADMIN`, `/api/faculty/**` requires `FACULTY`, and `/api/student/**` requires `STUDENT` in Spring Security. Existing controller `@PreAuthorize` checks remain in place. | Broken access control, accidental missing controller annotations, students/faculty calling admin APIs directly. |
| Security response headers | Added/strengthened `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, configurable CSP, and HTTPS-only HSTS. | Clickjacking, MIME sniffing, privacy leakage through referrers, unnecessary browser permission exposure, some cross-origin isolation risks, downgrade attacks on HTTPS deployments. |
| Configurable CSP mode | `CSP_ENFORCED=false` keeps CSP report-only by default; production can set `CSP_ENFORCED=true` after verifying frontend assets. | XSS blast radius reduction, unauthorized script/object/frame loading, unsafe form submission targets. |
| API no-store cache headers | `/api/**` responses receive `Cache-Control: no-store` and `Pragma: no-cache`. | Sensitive API data being cached by browsers/proxies. |
| Rate limiting | Added configurable rate-limit groups for login, password change, push notification operations, uploads/imports, report downloads, and mutation APIs. | Brute-force login, password-change abuse, upload spam, report-generation abuse, push-test abuse, mutation flooding. |
| Image signature validation | Poster and post-event media uploads now verify JPG/PNG/WEBP magic bytes in addition to content type and extension. | Malicious files renamed as images, polyglot upload attempts, accidental unsupported uploads. |
| Spreadsheet signature validation | Student/faculty import files and marks import now verify CSV/XLSX/XLS file signatures/extensions before parsing. | Executable or archive files disguised as imports, malformed upload abuse. |
| Public health endpoint hygiene | Existing `/health` and `/api/health` remain minimal and expose only status/app/timestamp. | Health monitoring without leaking database details, memory, stack, secrets, or internal dependencies. |
| Environment-driven security | Added documented env variables for CSP, HSTS, and rate-limit controls in `server/.env.example`. | Safer deployment tuning without code edits or hardcoded secrets. |
| Account lockout | Added failed login tracking on `users`; accounts temporarily lock after repeated failed login attempts. | Password guessing, credential stuffing against known accounts, repeated wrong-portal abuse. |
| Audit logging | Added `audit_logs` table and audit service for login success/failure, account lockout, password changes, access denied, event mutations, incharge changes, poster/media changes, problem statement changes, round result changes, final publish, and marks import. | Undetected misuse, weak incident response, inability to trace destructive/admin/result actions. |
| Request security filter | Added pre-controller request rejection for unsupported HTTP methods, path traversal markers, encoded separators/null bytes, CRLF query attempts, oversized query strings, oversized user agents, and unsupported mutation content types. | Path traversal probes, malformed request attacks, request smuggling indicators, noisy scanner traffic, accidental unsupported mutation bodies. |
| Strict Spring firewall | Added `StrictHttpFirewall` settings to reject semicolons, backslashes, encoded slash/double-slash, encoded percent, and encoded period in request paths. | Path normalization bypasses, matrix parameter abuse, encoded traversal bypass attempts. |
| JWT claim hardening | Tokens now include issuer, audience, and unique JWT ID. Parsing requires issuer/audience and authentication rejects tokens whose embedded user ID or role no longer matches the loaded user. | Token replay confusion across apps, forged/mis-scoped tokens, stale role claim mismatch after account changes. |
| Startup secret validation | Backend now rejects JWT secrets shorter than 32 bytes and can fail production startup if the default dev secret is still configured. | Weak signing keys, accidental deployment with development JWT secret. |
| Safer CORS validation | Wildcard CORS origins are rejected while credentials are enabled. Allowed origins remain environment-driven. | Browser credential exposure to unintended origins, unsafe `*` CORS deployment mistakes. |
| SuperAdmin audit API | Added read-only `GET /api/admin/audit-logs` with filters for action, outcome, actor email, page, and size. | Hidden security events, inability to review blocked requests and sensitive changes from the admin side/API tooling. |
| Frontend security headers | Next.js now emits production CSP, HSTS, COOP, no-sniff, frame deny, referrer policy, and permissions policy headers. Production CSP connect sources are based on the configured API origin. | Browser-side XSS blast radius, clickjacking, MIME sniffing, insecure transport, excess browser permissions, overly broad production connection policy. |
| Dependency vulnerability cleanup | Updated frontend dependencies and tooling so `npm audit --omit=dev` reports zero known vulnerabilities at validation time. | Known vulnerable npm packages in the deployed frontend dependency tree. |

## 3. Files Modified

| File | Purpose |
| --- | --- |
| `server/src/main/java/com/kec/codingforum/config/SecurityConfig.java` | Added URL-level role protection for admin/faculty/student API route families. |
| `server/src/main/java/com/kec/codingforum/security/SecurityHeadersFilter.java` | Added configurable CSP enforcement/report-only mode, HSTS, and stronger browser security headers. |
| `server/src/main/java/com/kec/codingforum/security/ApiRateLimitFilter.java` | Expanded rate limiting beyond login/password to push, upload/import, report, and mutation paths. |
| `server/src/main/java/com/kec/codingforum/security/FileSignatureValidator.java` | New reusable file signature validator for images and import spreadsheets. |
| `server/src/main/java/com/kec/codingforum/event/EventPosterService.java` | Added image magic-byte validation for poster uploads. |
| `server/src/main/java/com/kec/codingforum/event/EventMediaService.java` | Added image magic-byte validation for post-event media uploads. |
| `server/src/main/java/com/kec/codingforum/admin/StudentImportService.java` | Added import file content validation. |
| `server/src/main/java/com/kec/codingforum/admin/FacultyImportService.java` | Added import file content validation. |
| `server/src/main/java/com/kec/codingforum/event/EventRoundResultService.java` | Added Excel content validation for marks import. |
| `server/src/main/resources/application.yml` | Added security configuration properties. |
| `server/.env.example` | Documented security environment variables. |
| `server/src/main/resources/db/migration/V28__security_audit_and_login_lockout.sql` | Added audit log table and login lockout fields. |
| `server/src/main/java/com/kec/codingforum/audit/AuditLog.java` | Added audit log JPA entity. |
| `server/src/main/java/com/kec/codingforum/audit/AuditLogRepository.java` | Added audit log repository. |
| `server/src/main/java/com/kec/codingforum/audit/AuditService.java` | Added defensive audit recording service. |
| `server/src/main/java/com/kec/codingforum/audit/AdminAuditLogController.java` | Added SuperAdmin-only audit log listing endpoint. |
| `server/src/main/java/com/kec/codingforum/audit/AuditLogDto.java` | Added safe audit log response DTO. |
| `server/src/main/java/com/kec/codingforum/user/User.java` | Added failed login, locked-until, and last-login fields. |
| `server/src/main/java/com/kec/codingforum/auth/AuthService.java` | Added login lockout and auth audit records. |
| `server/src/main/java/com/kec/codingforum/common/GlobalExceptionHandler.java` | Added audit record for forbidden access attempts. |
| `server/src/main/java/com/kec/codingforum/event/*Controller.java` | Added audit records for sensitive admin/faculty event, media, round, incharge, and result actions. |
| `server/src/main/java/com/kec/codingforum/security/RequestSecurityFilter.java` | Added request-level security rejection before controller execution. |
| `server/src/main/java/com/kec/codingforum/security/JwtService.java` | Added issuer/audience/JTI claims and startup secret validation. |
| `server/src/main/java/com/kec/codingforum/security/JwtAuthenticationFilter.java` | Added token claim consistency checks against the current user record. |
| `server/src/main/java/com/kec/codingforum/config/CorsConfig.java` | Added wildcard origin rejection and stricter header constants. |
| `client/next.config.js` | Added production browser security headers and tighter production connect source calculation. |
| `client/package.json` and `client/package-lock.json` | Updated Next/PostCSS/security-related frontend dependencies to clear npm audit findings. |
| `client/eslint.config.mjs` | Migrated ESLint config to Next 16 native flat config exports. |

## 4. Current Threat Coverage

### Broken Access Control

Risk:
Students, faculty, or unauthenticated users may try to directly call protected APIs.

Protection:
Spring Security now enforces role boundaries at URL level, in addition to controller/service checks.

### Brute Force and Request Abuse

Risk:
Attackers can repeatedly attempt login, password changes, push tests, imports, uploads, or heavy report generation.

Protection:
The API rate limiter now throttles sensitive action groups by client address.

### Malicious File Uploads

Risk:
Attackers may upload executable files, scripts, or invalid archives renamed as images or Excel files.

Protection:
Uploads now validate declared type, extension, size, and file signature before storage/parsing.

### Clickjacking

Risk:
The portal could be embedded inside a malicious frame to trick users into clicking admin/faculty actions.

Protection:
`X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`.

### MIME Sniffing

Risk:
Browsers may interpret uploaded or returned files as executable content.

Protection:
`X-Content-Type-Options: nosniff`.

### Sensitive Data Caching

Risk:
API responses may be cached by browsers or intermediate proxies.

Protection:
`/api/**` responses are marked `no-store`.

### HTTPS Downgrade

Risk:
Users may accidentally use insecure HTTP after first visiting HTTPS.

Protection:
HSTS is added only when the backend request is HTTPS or forwarded as HTTPS.

### Account Takeover Attempts

Risk:
Attackers can repeatedly try passwords against known student, faculty, or admin accounts.

Protection:
Known accounts now track failed login attempts. After the configured threshold, the account is temporarily locked and the lockout is audited.

### Undetected Admin or Faculty Misuse

Risk:
An admin or faculty user may accidentally or maliciously change events, incharges, results, media, or problem statements without traceability.

Protection:
Sensitive operations now write audit records with actor, role, action, resource, outcome, IP address, user-agent, and timestamp.

### Request Firewall and Scanner Noise

Risk:
Attackers and automated scanners commonly probe encoded traversal paths, unsupported HTTP methods, null bytes, suspicious CRLF query payloads, and malformed content types.

Protection:
Requests are rejected before they reach controllers through Spring's strict firewall and a custom request security filter. Rejections are audited as `SUSPICIOUS_REQUEST_BLOCKED`.

### JWT Misuse and Weak Secret Deployment

Risk:
JWTs signed for one app could be accepted by another app using the same key, stale role claims may remain accepted after user changes, or production could accidentally launch with a development signing secret.

Protection:
JWTs now require configured issuer and audience, carry a unique ID, verify role/user ID against the database principal on each request, and validate secret strength during startup.

### Known Vulnerable Frontend Dependencies

Risk:
Known vulnerable packages in the production frontend dependency tree can expose the deployment to publicly documented attacks.

Protection:
Next.js, PostCSS, and related Next tooling were upgraded. `npm audit --omit=dev` returned zero known vulnerabilities after the update.

## 5. Deployment Security Configuration

Recommended production values:

```env
FRONTEND_ORIGIN=https://your-vercel-domain.example
JWT_SECRET=<strong-random-secret-at-least-32-bytes>
JWT_ISSUER=kec-coding-forum
JWT_AUDIENCE=kec-coding-forum-web
FAIL_ON_DEFAULT_SECRETS=true
CSP_ENFORCED=false
HSTS_ENABLED=true
REQUEST_SECURITY_BLOCK_SUSPICIOUS=true
RATE_LIMIT_ENABLED=true
ACCOUNT_LOCKOUT_MAX_FAILED_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=15
```

After verifying the deployed frontend has no CSP violations, change:

```env
CSP_ENFORCED=true
```

Do not commit real values for:

- `JDBC_DATABASE_URL`
- `DB_PASSWORD`
- `JWT_SECRET`
- `MAIL_PASSWORD`
- `WEB_PUSH_VAPID_PRIVATE_KEY`

## 6. Pending Security Phases

These are recommended next steps but were not implemented in this pass because they require larger design/testing work.

| Phase | Recommendation | Reason |
| --- | --- | --- |
| Database read views | Create read-only database views for event cards, leaderboard rows, analytics summaries, and registration summaries. | Reduces accidental column exposure and simplifies DTO queries. |
| Audit log UI | Add a SuperAdmin page that consumes `GET /api/admin/audit-logs`. | The secure backend API exists; a polished UI would make inspection easier for non-technical admins. |
| Advanced account protection | Add email alert/admin alert on repeated lockouts and optional manual unlock controls. | Improves operational response to active account attacks. |
| Malware scanning | Integrate upload malware scanning before production use. | Signature validation does not detect all malicious image payloads. |
| Cloudflare/WAF | Place the deployed frontend/API behind WAF rules and bot protection where possible. | Adds infrastructure-level filtering and DDoS resistance. |
| Dependency scanning | Add OWASP Dependency Check or GitHub Dependabot/Snyk. | Detects vulnerable Maven/npm packages. |
| Strong CSP rollout | Move from report-only to enforced CSP after browser validation. | Reduces XSS impact more strongly. |
| Secret rotation | Rotate any secrets that were ever pasted in chat, screenshots, or Git history. | Prevents credential reuse after accidental exposure. |
| Centralized monitoring | Add Sentry or equivalent error/security monitoring. | Speeds up detection of attacks and production failures. |

## 7. Validation Results

Backend:

```text
./mvnw.cmd clean compile -DskipTests
BUILD SUCCESS
```

Phase 2 validation:

```text
./mvnw.cmd clean compile -DskipTests
BUILD SUCCESS
```

Frontend:

Final security phase validation:

```text
./mvnw.cmd clean compile -DskipTests
BUILD SUCCESS

npm audit --omit=dev
found 0 vulnerabilities

npm exec tsc -- --noEmit
PASS

npm run build
PASS

npm run lint
PASS
```

## 8. Known Limitations

- Rate limiting is in-memory. It resets on backend restart and is not shared across multiple instances.
- Client IP detection uses `X-Forwarded-For` when present, which is suitable behind Render/proxies but should be paired with platform-level rate limiting for stronger protection.
- CSP is report-only by default to avoid breaking deployed UI assets. Enforce it only after checking browser console violations.
- File signature validation is not a malware scanner.
- Database views were documented as a future hardening phase, not implemented yet.
- No application can be guaranteed to have literally zero vulnerabilities. The validation result means zero known npm audit vulnerabilities at the time of testing plus successful compile/build/lint checks.
- Maven dependency vulnerability scanning still needs CI/tooling such as OWASP Dependency Check, GitHub Dependabot, Snyk, or a Render/GitHub security gate.
