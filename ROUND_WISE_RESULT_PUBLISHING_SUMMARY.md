# Round-Wise Result Publishing Summary

## Scope

Implemented round-wise publishing so the event page no longer uses one common publish action.

## Backend Changes

- Added Flyway migration `V12__round_wise_result_publishing.sql`.
- Added round publish metadata to `event_rounds`:
  - `result_published`
  - `result_published_at`
  - `published_by`
- Added round publish endpoints:
  - `POST /api/admin/events/{eventId}/rounds/{roundId}/publish-round-result`
  - `POST /api/admin/events/{eventId}/rounds/{roundId}/publish-final-result`
  - `POST /api/faculty/events/{eventId}/rounds/{roundId}/publish-round-result`
  - `POST /api/faculty/events/{eventId}/rounds/{roundId}/publish-final-result`
- Added student round progress endpoint:
  - `GET /api/student/events/{eventId}/rounds/{roundId}/result`
- Non-final round publishing:
  - Requires `ONGOING` round status.
  - Uses only `QUALIFIED` / `DISQUALIFIED`.
  - Does not generate final points.
  - Does not complete the event.
  - Creates next-round rows only for qualified participants.
  - Locks the published round.
- Final round publishing:
  - Requires at least one draft final result.
  - Supports `WINNER`, `RUNNER_UP`, `SECOND_RUNNER_UP`, `PARTICIPANT`, `DISQUALIFIED`.
  - Generates official results and student points.
  - Marks the final round published.
  - Marks the event completed and closes registration.
- Published rounds are now locked in backend round update/status/delete operations.

## Frontend Changes

- Replaced global event-level publish controls with round-level actions.
- Result entry page now shows:
  - `Publish Round Result` for non-final rounds.
  - `Publish Final Result` for final rounds.
  - Published/locked status and published timestamp.
- Non-final rounds show a Disqualified toggle instead of winner/result dropdowns.
- Final rounds show final result dropdowns.
- Published rounds disable switches, dropdowns, save buttons, and status controls.
- Student event detail now shows per-round progress:
  - “Round result not published yet.”
  - `QUALIFIED` / `DISQUALIFIED` after non-final publication.
  - final result after final publication.

## Validation Commands Run

Backend:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd clean compile -DskipTests
```

Result: `BUILD SUCCESS`

Backend startup / migration:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run
Invoke-RestMethod -Uri 'http://localhost:8081/api/health'
```

Result: backend returned `{"status":"UP","app":"kec-coding-forum",...}`.

Frontend:

```powershell
npm.cmd exec tsc -- --noEmit
npm.cmd run lint
npm.cmd run build
```

Results:

- TypeScript: passed.
- ESLint: passed.
- Next.js production build: passed, generated 35 static pages.

## Not Implemented

- No round-wise scoring.
- No approval workflow.
- No SuperAdmin override/unpublish flow.
- No leaderboard/report changes in this update.
