# Block 10 - Notification Button, WebSocket, Email

## Database

- Added Flyway migration `V10__notifications.sql`.
- Created `notifications` table with user ownership, read state, email delivery state, related entity metadata, and timestamps.
- Added indexes for user/read state, user/created date, notification type, and related entity lookup.

## Backend

- Added notification entity, repository, DTOs, controller, and services.
- Added common authenticated endpoints:
  - `GET /api/notifications`
  - `GET /api/notifications/recent`
  - `GET /api/notifications/unread-count`
  - `PATCH /api/notifications/{id}/read`
  - `PATCH /api/notifications/read-all`
  - `DELETE /api/notifications/{id}`
- Added recipient resolution for eligible students, registered students, team members, team leader, assigned faculty, and SuperAdmins.
- Added SMTP configuration with email disabled by default:
  - `NOTIFICATION_EMAIL_ENABLED=false`
  - email failure is captured on the notification and does not block the main workflow.
- Added native WebSocket endpoint:
  - `/ws?token=<jwt>`
  - JWT is validated during socket connection.
  - Real-time payloads are sent to connected user sessions.
  - Frontend REST polling remains the fallback.

## Notification Hooks Added

- Event published.
- Registration closed.
- Individual registration completed.
- Team joined.
- Team registration completed.
- Results published.
- Event completed after result publish.
- Round created/updated/status changed.
- Problem statement created/updated/status changed when registrations exist.

## Frontend

- Added Topbar notification bell button with unread count badge.
- Dropdown shows recent 5 notifications.
- Dropdown includes unread/read state, type badge text, short time, and `Show all`.
- `Show all` routes:
  - Student: `/student/notifications`
  - Faculty: `/faculty/notifications`
  - SuperAdmin: `/admin/notifications`
- Added full notification pages:
  - `/student/notifications`
  - `/faculty/notifications`
  - `/admin/notifications`
- Added filters for all/unread and notification type.
- Added mark one as read and mark all as read.
- Added role-aware notification navigation for event/team/result-related notifications.
- Added sidebar Notifications links for all roles.

## Validation Results

- Backend compile: passed.
  - Command: `./mvnw.cmd clean compile -DskipTests`
- Backend start: passed on port `8081`.
- DB migration: passed.
  - Flyway validated 10 migrations.
  - Migration `V10__notifications` applied successfully.
- API smoke test: passed.
  - Admin login succeeded with `keccodingforum@kongu.edu`.
  - `GET /api/notifications/unread-count` returned `0`.
  - `GET /api/notifications/recent` returned an empty list.
  - `GET /api/notifications?size=5` returned an empty page.
- Frontend type-check: passed.
  - Command: `npm.cmd exec tsc -- --noEmit`
- Frontend lint: passed.
  - Command: `npm.cmd run lint`
- Frontend build: attempted, but local `next build` repeated the known hang after the Next.js banner. The hung build Node processes were stopped.

## Pending / Intentionally Not Implemented

- SMS/WhatsApp notifications.
- Browser push notifications.
- Notification preference settings.
- Scheduled reminders.
- Certificate email automation.
- STOMP broker destinations. The implemented real-time path uses a native WebSocket endpoint with JWT and REST polling fallback.
