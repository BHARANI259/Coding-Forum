# Block 8.5 - Pre-report Features Summary

## Scope Completed

Implemented pre-report event data features:

- event problem statements
- problem statement selection during individual/team registration
- result publish flow with automatic event completion
- student event card UX
- detailed student event page with view/register flow
- editable event rounds
- multiple faculty incharges surfaced in UI/API
- student technical area: `SOFTWARE` / `HARDWARE`

No PDF/Excel reports, notifications, WebSocket/email, round-wise scoring, or result-change approval workflow were added.

## Database Migration

Added:

- `server/src/main/resources/db/migration/V6__pre_report_features.sql`

Migration changes:

- created `event_problem_statements`
- created `event_rounds`
- created `event_allowed_technical_areas`
- added `students.technical_area`
- added `registrations.problem_statement_id`
- added `teams.problem_statement_id`
- added `events.results_published`
- added `events.results_published_at`
- added indexes for problem statements, rounds, technical area, and result publish state

## Backend Endpoints Added

Problem statements:

- `GET /api/admin/events/{eventId}/problem-statements`
- `POST /api/admin/events/{eventId}/problem-statements`
- `PUT /api/admin/events/{eventId}/problem-statements/{problemStatementId}`
- `PATCH /api/admin/events/{eventId}/problem-statements/{problemStatementId}/status`
- `GET /api/faculty/events/{eventId}/problem-statements`
- `GET /api/student/events/{eventId}/problem-statements`

Rounds:

- `GET /api/admin/events/{eventId}/rounds`
- `POST /api/admin/events/{eventId}/rounds`
- `PUT /api/admin/events/{eventId}/rounds/{roundId}`
- `PATCH /api/admin/events/{eventId}/rounds/{roundId}/status`
- `DELETE /api/admin/events/{eventId}/rounds/{roundId}`
- `GET /api/faculty/events/{eventId}/rounds`
- `POST /api/faculty/events/{eventId}/rounds`
- `PUT /api/faculty/events/{eventId}/rounds/{roundId}`
- `PATCH /api/faculty/events/{eventId}/rounds/{roundId}/status`
- `GET /api/student/events/{eventId}/rounds`

Result publishing:

- `POST /api/admin/events/{eventId}/results/publish`
- `POST /api/faculty/events/{eventId}/results/publish`

Updated:

- `POST /api/student/events/{eventId}/register` accepts `problemStatementId`
- `POST /api/student/teams/{teamId}/register` accepts `problemStatementId`
- student result endpoints hide unpublished results
- student creation/import/list supports `technicalArea`
- event create/update/list/detail supports `allowedTechnicalAreas`, `roundsCount`, `problemStatementCount`, `resultsPublished`

## Frontend Updates

Updated:

- `client/lib/api.ts`
- `client/components/events/EventSummary.tsx`
- `client/components/events/EventRegistrationsTable.tsx`
- `client/components/events/EventForm.tsx`
- `client/app/student/events/page.tsx`
- `client/app/student/events/[id]/page.tsx`
- `client/app/student/teams/page.tsx`
- `client/app/student/registrations/page.tsx`
- `client/app/student/results/page.tsx`
- `client/app/admin/students/page.tsx`
- `client/app/admin/events/[id]/page.tsx`
- `client/app/faculty/events/[id]/page.tsx`

## Problem Statement Flow

- Admin creates and activates/deactivates problem statements per event.
- Faculty incharges can view problem statements for assigned events.
- Eligible students can view active problem statements.
- If an event has active problem statements, individual/team registration requires selecting one.
- Individual registrations store `registrations.problem_statement_id`.
- Team registrations store `teams.problem_statement_id` and copy the problem statement into each registration row.
- Student registrations and teams display the selected problem statement.

## Result Publish Flow

- Results can be saved before publishing.
- Student result APIs hide results until `events.results_published = true`.
- Publishing requires at least one result.
- Publishing sets:
  - `results_published = true`
  - `results_published_at = now`
  - `status = COMPLETED`
  - `registration_open = false`
- Re-publishing is idempotent and returns a clean message.
- Completed events reject new registrations and team operations.

## Event Card UX

- `/student/events` now uses event cards instead of a plain table.
- Cards show event type, category, incharges, date, registration timeline, rounds count, problem statement count, and technical areas.
- Registration routes through `/student/events/[id]` so students can view details and select problem statements before registering.

## Round Management

- Admin can create rounds and update round status.
- Assigned faculty can create rounds and update round status.
- Students can view rounds for eligible events.
- No round-wise scoring was added.

## Technical Area Logic

- Students have `technicalArea`: `SOFTWARE` or `HARDWARE`.
- Missing import value defaults to `SOFTWARE`.
- Admin student create/list/filter supports technical area.
- Events can restrict allowed technical areas.
- If an event has no technical-area restriction, both areas are eligible.
- Eligibility service enforces technical-area restrictions.

## Validation Commands

Backend compile:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd clean compile -DskipTests
```

Result:

- `BUILD SUCCESS`
- Compiled 163 source files.

Backend run:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run
```

Result:

- Started on port `8081`.
- Flyway validated 6 migrations.
- Schema version was `6`.

Frontend type-check:

```powershell
npm.cmd exec tsc -- --noEmit
```

Result:

- Passed.

Frontend lint:

```powershell
npm.cmd run lint
```

Result:

- Passed.
- `eslint . --max-warnings=0`

Frontend build:

```powershell
npm.cmd run build
```

Result:

- Started Next.js 15.5.19 build.
- Hung after the Next.js banner for more than 60 seconds with no diagnostics.
- Only the Node processes started by this build attempt were stopped.
- This matches the earlier local build hang behavior; type-check and lint passed.

## API Smoke Tests

Tested using:

- SuperAdmin: `keccodingforum@kongu.edu / Codingforum@2428`
- Student default password rule for newly created students: register number
- Faculty: `faculty@kongu.edu / iniya@1103`

Passed:

- created `SOFTWARE` student
- created `HARDWARE` student
- created `SOFTWARE`-restricted individual event
- verified `HARDWARE` student could not view restricted event
- created problem statement
- created round
- verified problem statement selection is required
- registered individual event with selected problem statement
- verified student result hidden before publish
- declared result
- published results
- verified event became `COMPLETED`
- verified registration closed
- verified student result visible after publish
- verified registration rejected after completion
- created team event with problem statement
- created team
- joined team by code
- verified team problem statement selection is required
- registered team with selected problem statement
- verified assigned faculty can update round status

## Known Pending Items

Intentionally not implemented:

- PDF reports
- Excel reports
- notifications
- WebSocket/email
- round-wise scoring
- advanced certificate generation
- complex result-change approval workflow

Remaining polish for later:

- richer edit UI for existing problem statement text/link
- round delete/status UI refinements for faculty
- advanced date-filtered report preparation
