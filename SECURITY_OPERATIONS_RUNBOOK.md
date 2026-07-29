# KEC Coding Forum Security Operations Runbook

## Incident Response

1. Detect: collect affected route, user role, timestamp, request ID or server log context, and affected account IDs.
2. Contain: disable compromised accounts, stop suspicious uploads, and temporarily disable broad notification/email sending if involved.
3. Revoke: rotate `JWT_SECRET` if tokens may be compromised. This invalidates existing access tokens.
4. Rotate: update database, SMTP, VAPID, and deployment secrets through the hosting provider secret manager. Do not commit secrets.
5. Review: inspect backend logs for repeated 401/403/429 responses, unusual report exports, upload failures, or admin changes.
6. Restore: use database/provider backups only after validating the restore target is not publicly exposed.
7. Notify: inform the responsible coding forum coordinator, faculty incharge, and college IT contact according to institutional policy.
8. Document: record root cause, timeline, impact, containment, and permanent remediation.

## Secret Rotation Plan

- `JWT_SECRET`: replace with a 32-byte or longer random value in deployment secrets, redeploy backend, and force users to log in again.
- `DB_PASSWORD`: rotate in database provider, update backend environment, redeploy, then revoke old credential.
- `MAIL_PASSWORD`: rotate in SMTP provider, update backend environment, test email only after redeploy.
- `WEB_PUSH_VAPID_PRIVATE_KEY`: rotate only with a plan; existing browsers may need to resubscribe.
- `NEXT_PUBLIC_*`: only public values are allowed. Never put database, mail, JWT, or VAPID private secrets in frontend variables.

## Monitoring Signals

- Repeated login failures and 429 responses.
- Multiple 403 responses for the same user/IP.
- Failed upload attempts or unsupported file types.
- Repeated notification or push-subscription errors.
- High report-export volume.
- Admin changes to users, incharges, events, results, or reports.
- Unexpected backend 500 errors.

## Production Configuration Checklist

- Set `FRONTEND_ORIGIN` to the exact deployed frontend origin.
- Set `JDBC_DATABASE_URL`, `DB_USER`, and `DB_PASSWORD` from provider secrets.
- Set a strong `JWT_SECRET`; do not use the development fallback.
- Keep `RATE_LIMIT_ENABLED=true`.
- Keep email disabled unless SMTP credentials and sender policy are verified.
- Serve frontend and backend only over HTTPS/WSS in production.
- Configure HSTS at the hosting/reverse-proxy layer after domain verification.
- Keep upload directories outside source control and backed up according to college policy.
- Do not expose database ports publicly.
- Do not print environment variables in CI/deployment logs.

## Secure Development Rules

- Backend authorization is the authority; frontend hiding is only UX.
- Never bind request bodies directly into JPA entities.
- Validate ownership for every endpoint accepting an ID.
- Keep generated reports and private media behind authenticated endpoints.
- Keep service-worker caching away from `/api/**`, auth pages, role dashboards, and protected files.
- Add new file upload types only with size, MIME, extension, and path traversal checks.
- Use DTOs for responses; do not expose entity graphs.
- Stage CSP changes in report-only mode before enforcement.
