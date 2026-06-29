# Block 7 - Final Result Tagging + Points Generation Summary

## Scope Completed

- SuperAdmin final result tagging.
- Assigned faculty final result tagging.
- Student result viewing.
- Individual result upsert.
- Team result upsert.
- Automatic point generation into `student_points`.
- Idempotent point replacement using `RESULT:<resultId>`.
- Result clearing for SuperAdmin.

No leaderboard UI, reports, notifications, result-change approval workflow, or round-wise scoring was added.

## Backend Endpoints Added

Admin:

- `GET /api/admin/events/{eventId}/results`
- `POST /api/admin/events/{eventId}/results/individual`
- `POST /api/admin/events/{eventId}/results/team`
- `DELETE /api/admin/results/{resultId}`

Faculty:

- `GET /api/faculty/events/{eventId}/results`
- `POST /api/faculty/events/{eventId}/results/individual`
- `POST /api/faculty/events/{eventId}/results/team`

Student:

- `GET /api/student/results`
- `GET /api/student/events/{eventId}/results`

## Backend Files Created/Updated

- `ResultService`
- `ResultPointPolicyService`
- `StudentPointService`
- `AdminResultController`
- `FacultyResultController`
- `StudentResultController`
- Result DTOs under `server/src/main/java/com/kec/codingforum/result/dto`
- Repository helpers in `ResultRepository`
- Repository helpers in `StudentPointRepository`
- `V5__student_points_reason_index.sql`

## Result Flow

Individual events:

- Result is assigned to a registered student.
- Event must be `INDIVIDUAL`.
- Student must have a `REGISTERED` registration row.
- Existing result for the same event/student is updated.
- Points are regenerated safely.

Team events:

- Result is assigned to a registered team.
- Event must be `TEAM`.
- Team must belong to the event.
- Team must have `REGISTERED` registration rows.
- Existing result for the same event/team is updated.
- Points are generated for every registered team member.

## Point Calculation

Central service: `ResultPointPolicyService`

Base points:

- `WINNER = 100`
- `RUNNER_UP = 60`
- `SECOND_RUNNER_UP = 40`
- `PARTICIPANT = 10`
- `DISQUALIFIED = 0`

Formula:

```text
finalPoints = round(basePoints * eventCategory.weightage)
```

The backend calculates points. Faculty/admin cannot pass arbitrary points.

## Point Replacement Behavior

Each result writes points with:

```text
reason = RESULT:<resultId>
```

When a result is updated:

- Existing `student_points` rows for `RESULT:<resultId>` are deleted.
- New rows are inserted.
- For individual results, one student point row is created.
- For team results, one student point row is created per registered team member.
- Department comes from the student profile.
- Category comes from the event.

## Frontend Pages Added/Updated

- `/admin/events/[id]/results`
- `/faculty/events/[id]/results`
- `/student/results`
- `/student/events/[id]` now shows `My Result`
- `/admin/events/[id]` now links to `Manage Results`
- `/faculty/events/[id]` now links to `Enter Results`

Frontend components:

- `EventResultsManager`
- `ResultBadge`

Frontend API functions added in `client/lib/api.ts`.

## Validation Command Results

Backend:

- `.\mvnw.cmd clean compile -DskipTests`
  - Passed.
  - Compiled 120 source files.
- `.\mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run`
  - Passed.
  - Started on port `8081`.
  - Flyway validated 5 migrations.
  - Applied V5 migration successfully.

Frontend:

- `npm run type-check`
  - Passed.
- `npm run lint`
  - Passed.
- `npm run build`
  - Still hangs after the Next.js banner in this local environment.
  - The build-era Node processes were stopped.

## API Test Results

Used:

- SuperAdmin: `admin@kongu.edu / Codingforum@2428`
- Student: `student@kongu.edu / dharsini@3031`
- Faculty: `faculty@kongu.edu / iniya@1103`

Result API smoke output:

```json
{
  "IndividualEventId": 3,
  "IndividualWinnerPoints": 100,
  "IndividualUpdatedType": "RUNNER_UP",
  "IndividualUpdatedPoints": 60,
  "IndividualResultCount": 1,
  "TeamEventId": 4,
  "TeamWinnerPoints": 100,
  "TeamResultMembers": 2,
  "TeamResultCount": 1,
  "FacultyUpdatedTeamType": "RUNNER_UP",
  "FacultyUpdatedTeamPoints": 60,
  "StudentResultCount": 2,
  "StudentEventResultType": "RUNNER_UP",
  "StudentEventPoints": 60,
  "StudentAdminAccess": "Rejected 403",
  "UnassignedFacultyAccess": "Rejected 403"
}
```

Database verification for `student_points`:

```text
reason   | rows | total_points | students | department_rows
RESULT:1 | 1    | 60           | 1        | 1
RESULT:2 | 2    | 120          | 2        | 2
```

This confirms:

- Individual result points were replaced, not duplicated.
- Team result points were distributed to both registered members.
- Department ids were populated from student profiles.

## Known Pending Items

- Resolve the existing local Next.js production build hang.
- Leaderboard UI and point aggregation are intentionally deferred to a later block.
- Result-change approval workflow is intentionally not implemented.

## Intentionally Not Implemented

- Leaderboard UI
- Reports
- Notifications
- WebSocket/email logic
- Complex result-change approval workflow
- Round-wise scoring
