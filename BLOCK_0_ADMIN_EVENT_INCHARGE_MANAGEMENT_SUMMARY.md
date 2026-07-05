# Block 0 - Admin Event Incharge Management

## Database Changes

- Added Flyway migration `V11__event_incharge_metadata.sql`.
- Kept the existing `event_incharges(event_id, faculty_id)` join table stable.
- Added safe metadata columns:
  - `id`
  - `primary_incharge`
  - `responsibility`
  - `assigned_by`
  - `assigned_at`
- Added indexes for event, faculty, primary incharge, and assignment id.
- Existing assignments are preserved.

## Backend Endpoints Added

- `GET /api/admin/event-incharges`
- `GET /api/admin/events/{eventId}/incharges`
- `POST /api/admin/events/{eventId}/incharges`
- `PUT /api/admin/events/{eventId}/incharges`
- `PATCH /api/admin/event-incharges/{assignmentId}`
- `DELETE /api/admin/event-incharges/{assignmentId}`
- `GET /api/admin/event-incharges/faculty-options`

All endpoints require `SUPER_ADMIN`.

## Backend Components Added

- `EventIncharge`
- `EventInchargeRepository`
- `EventInchargeService`
- `AdminEventInchargeController`
- DTOs:
  - `EventInchargeDto`
  - `AssignEventInchargeRequest`
  - `BulkUpdateEventInchargesRequest`
  - `UpdateEventInchargeRequest`
  - `FacultyOptionDto`
- Added `ConflictException` so duplicate assignment returns HTTP `409`.

## Primary Incharge Behavior

- One event can have multiple faculty incharges.
- Only one faculty can be primary for an event.
- When a faculty assignment is saved as primary, all other incharges for that event are automatically changed to non-primary.
- In bulk replace, if multiple submitted rows are marked primary, the first primary row is kept as primary and the rest are saved as co-incharges.

## Duplicate Assignment Behavior

- Duplicate `(eventId, facultyId)` assignment is blocked.
- API returns clean `409 CONFLICT`.

## Frontend Pages / UI Added

- Replaced placeholder route:
  - `/admin/event-incharges`
- Added:
  - assignment form
  - filters by search, event, faculty, department, category, status
  - assignment table
  - edit responsibility / primary
  - remove assignment
  - empty/loading/error/success states
- Existing Admin sidebar already had `Event Incharges`; it now opens the completed page.

## Admin Event Detail Updates

- Updated `/admin/events/[id]`.
- Added `Faculty Incharges` section.
- Shows:
  - faculty name
  - faculty code
  - department
  - email
  - primary/co-incharge badge
  - responsibility
  - assigned date
- Added actions:
  - Manage Incharges
  - Add Incharge
  - Edit
  - Remove

## Event Create/Edit Updates

- Existing multiple faculty incharge selection remains working.
- Added selected faculty chips/cards for clearer selection.
- Primary incharge and responsibility are managed from the dedicated Event Incharges section after saving.
- Events can still be created without incharges, matching the current project behavior.

## Faculty Permission Behavior

- Existing faculty authorization checks already use `event_incharges`.
- New assignments immediately affect:
  - faculty assigned event list
  - faculty event detail access
  - faculty registration views
  - faculty result entry/publish permissions
  - faculty round management
  - faculty event reports
- Removed faculty no longer has restricted access to that event.

## Validation Results

### Backend

- `./mvnw.cmd clean compile -DskipTests`: passed.
- `./mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run`: passed.
- Flyway validated 11 migrations.
- Migration `V11__event_incharge_metadata` applied successfully.

### API Smoke Tests

- SuperAdmin login: passed.
- `GET /api/admin/event-incharges`: passed.
- Created a smoke-test event.
- Assigned faculty A to event: passed.
- Assigned faculty B to same event: passed.
- Duplicate assignment of faculty A: rejected with `409`.
- Marked faculty A as primary and updated responsibility: passed.
- Verified event had 2 incharges before removal: passed.
- Removed faculty B: passed.
- Verified event had 1 incharge after removal: passed.
- Faculty A could access assigned event from faculty API: passed.
- Removed faculty B received `403` for direct faculty event access: passed.
- Non-admin access to admin incharge API returned forbidden: passed.

### Frontend

- `npm.cmd exec tsc -- --noEmit`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## Known Pending Items

- No event poster/flyer upload added.
- No post-event gallery upload added.
- No leaderboard changes made.
- No reports changes made.
- No notifications changes made.
- No analytics charts added.
