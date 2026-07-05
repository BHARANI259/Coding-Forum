# Block 3 - Problem Statement Upgrade with Multiple Reference Links

## Database Migration Changes

- Added `V14__problem_statement_multiple_links.sql`.
- Created `event_problem_statement_links`.
- Migrated existing `event_problem_statements.reference_link` values into link rows.
- Kept the old `reference_link` column for compatibility.
- Made `event_problem_statements.description` non-null after converting existing nulls to empty strings.
- Added indexes:
  - `event_problem_statements(active)`
  - `event_problem_statement_links(problem_statement_id)`

## Backend Changes

- Added entity and repository:
  - `EventProblemStatementLink`
  - `EventProblemStatementLinkRepository`
- Updated `EventProblemStatement` to own multiple links.
- Updated DTOs:
  - `ProblemStatementDto`
  - `ProblemStatementLinkDto`
  - `CreateProblemStatementRequest`
  - `UpdateProblemStatementRequest`
- Updated `EventProblemStatementService`:
  - validates title and description
  - validates HTTP/HTTPS reference URLs
  - supports full link-list replacement on create/update
  - preserves old `referenceLink` compatibility
  - returns `links[]` for admin, faculty, and student APIs
  - deletes unused problem statements
  - deactivates used problem statements instead of hard deleting
- Added admin delete endpoint:
  - `DELETE /api/admin/events/{eventId}/problem-statements/{problemStatementId}`

## Frontend Admin UI

- Reworked `/admin/events/[id]` Problem Statements section.
- Added clear add/edit form with:
  - title
  - description
  - active toggle
  - dynamic multiple reference links
- Added problem statement table with:
  - title
  - description
  - link chips
  - active/inactive badge
  - edit
  - activate/deactivate
  - delete
- Added `lib/api/problemStatements.ts` convenience exports.

## Student Flow

- Student event detail now displays multiple reference links for each active problem statement.
- Frontend now blocks registration with:
  - `Please select a problem statement before registering.`
- Existing backend enforcement remains:
  - individual registration requires a selected active problem statement when active statements exist
  - team registration requires team leader to select an active problem statement when active statements exist
  - selected problem statement must belong to the event

## Faculty Visibility

- Faculty event detail now shows problem statements read-only with multiple reference links.
- Faculty editing is intentionally not enabled in this block.

## Validation Command Results

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

Result:

- Flyway validated 14 migrations.
- Applied `V14 - problem statement multiple links`.
- `/api/health` returned `UP`.
- The temporary backend was stopped manually after validation, so Maven reported exit code `-1` because the process was intentionally terminated.

Frontend:

```powershell
npm.cmd exec tsc -- --noEmit
npm.cmd run lint
npm.cmd run build
```

Results:

- TypeScript: passed.
- ESLint: passed.
- Next.js production build: passed.

## API Test Results

- Compile, migration, startup, and health were verified.
- Full create/update/delete API testing with real event data was not run to avoid modifying current event data during validation.

## Known Pending Items

- Student `/student/teams` page still shows selected problem statement title, not full links.
- Registrations page still shows selected problem statement title, not full links.

## Intentionally Not Implemented

- Post-event gallery/photo upload.
- Analytics charts.
- Reports.
- Notifications.
- Certificate generation.
- Faculty-side problem statement editing.
