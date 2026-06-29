# Block 6 - Team Creation + Auto-Approved Registration Summary

## Scope Completed

- Student individual event registration.
- Student team creation for TEAM events.
- Unique team code generation.
- Join team by code.
- My teams view.
- Leave team rules.
- Leader-only team registration.
- Auto-approved registration rows with `REGISTERED` status.
- Team lock after registration.
- My registrations view.
- Registration cancellation was later removed by product rule; submitted registrations are final.
- Admin read-only event registrations.
- Faculty read-only assigned event registrations.
- Capacity and registration-window enforcement.

No registration approval flow was added.

## Backend Endpoints Added

Student teams:

- `POST /api/student/events/{eventId}/teams`
- `POST /api/student/teams/join`
- `GET /api/student/teams`
- `GET /api/student/teams/{teamId}`
- `DELETE /api/student/teams/{teamId}/members/me`
- `POST /api/student/teams/{teamId}/register`

Student registrations:

- `POST /api/student/events/{eventId}/register`
- `GET /api/student/registrations`

Admin/faculty registration views:

- `GET /api/admin/events/{eventId}/registrations`
- `GET /api/faculty/events/{eventId}/registrations`

## Backend Files Created/Updated

- `TeamService`
- `RegistrationService`
- `EventCapacityService`
- `StudentTeamController`
- `StudentRegistrationController`
- `AdminEventRegistrationController`
- `FacultyEventRegistrationController`
- Team DTOs under `server/src/main/java/com/kec/codingforum/team/dto`
- Registration DTOs under `server/src/main/java/com/kec/codingforum/registration/dto`
- Repository query methods for teams, team members, and registrations.
- `V4__registration_indexes.sql`

## Registration Flow

Individual events:

- Student must be logged in.
- Event must be `INDIVIDUAL`, `PUBLISHED` or `ONGOING`.
- Registration must be open and inside the configured window.
- Student must be eligible.
- Student must not already be registered or in a team for that event.
- Capacity is checked.
- One `registrations` row is created with `registration_type = INDIVIDUAL` and `status = REGISTERED`.

Team events:

- Student creates a team for an eligible TEAM event.
- System generates a unique team code.
- Creator is stored as leader and first team member.
- Other eligible students join using the code.
- Only the leader can register the team.
- On registration, every member receives a `registrations` row with `registration_type = TEAM` and `status = REGISTERED`.
- Team is locked after registration.

## Capacity Rules

- `max_participants` counts active `REGISTERED` registration rows.
- `max_teams` counts registered teams.
- Team registration checks `registered participants + team member count`.
- Team registration checks `registered teams + 1`.
- Team join checks `max_team_size`.
- Team registration checks `min_team_size` and `max_team_size`.

## Frontend Pages Updated

- `/student/events`
- `/student/events/[id]`
- `/student/teams`
- `/student/registrations`
- `/admin/events/[id]`
- `/faculty/events/[id]`

Frontend API functions were added in `client/lib/api.ts` for teams, registrations, and event registration views.

## Validation Command Results

Backend:

- `.\mvnw.cmd clean compile -DskipTests`
  - Passed.
  - Compiled 108 source files.
- `.\mvnw.cmd spring-boot:run`
  - Port `8080` was already in use.
- `.\mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run`
  - Passed after retry.
  - Started on port `8081`.
  - Flyway validated 4 migrations.

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
- Student A: `student@kongu.edu / dharsini@3031`
- Student B: freshly created test student, password = register number
- Faculty: `faculty@kongu.edu / iniya@1103`

Passed flow:

```json
{
  "AdminRole": "SUPER_ADMIN",
  "StudentBEmail": "b6181650@kongu.edu",
  "IndividualEventId": 3,
  "TeamEventId": 4,
  "IndividualRegistrationStatus": "REGISTERED",
  "DuplicateIndividual": "Rejected 400",
  "TeamId": 1,
  "TeamCode": "KECUDDSWK",
  "JoinedMemberCount": 2,
  "TeamRegistrationStatus": "REGISTERED",
  "RegisteredTeamMembers": 2,
  "LockedJoin": "Rejected 400",
  "TeamSeparateRegister": "Rejected 400",
  "AdminTeamRegistrationRows": 2,
  "FacultyTeamRegistrationRows": 2,
  "MyTeamsCount": 1,
  "MyRegistrationsCount": 2
}
```

Unassigned faculty access check:

```json
{
  "UnassignedFacultyAccess": "Rejected",
  "Status": 403,
  "EventId": 4
}
```

## Pending Items

- Resolve existing local Next.js production build hang.
- Team cancellation by leader is not implemented in this block.
- Ownership transfer is not implemented; leader cannot leave while other members exist.

## Intentionally Not Implemented

- Result entry
- Points
- Leaderboard
- Reports
- Notifications
- WebSocket/email logic
- Registration approval flow
- Mandatory event penalty logic
- Round-wise scoring
