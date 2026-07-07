# KEC Coding Forum Handover

## Roles

SuperAdmin manages master data, users, event setup, event incharges, analytics, reports, and correction workflows.

Faculty users manage only assigned events. Assignment is enforced through `event_incharges`.

Students view eligible events, register individually or through teams, track round progress, view published results, and see leaderboard/statistics.

## SuperAdmin Workflow

1. Login at `/auth/admin/login`.
2. Confirm dashboard and analytics load.
3. Manage departments, students, and faculty.
4. Create event categories.
5. Create/edit events with poster, restrictions, rounds, and faculty incharges.
6. Add problem statements with reference links from the event detail page.
7. Monitor registrations, results, post-event media, reports, and notifications.
8. Use the event setup checklist on event detail before publishing or demo review.

## Faculty Workflow

1. Login at `/auth/faculty/login`.
2. Open assigned events from dashboard or `/faculty/events`.
3. View event details, problem statements, registrations, rounds, and media.
4. For non-final rounds, mark participants/teams disqualified and publish that round result.
5. For final rounds, enter final result labels and publish final result.
6. Final result publishing completes the event and locks result editing.
7. Upload post-event media only after completion.

## Student Workflow

1. Login at `/auth/student/login`.
2. Browse events at `/student/events`.
3. Open event detail to see poster, restrictions, incharges, rounds, and problem statements.
4. Register individually for individual events.
5. For team events, create or join a team, then leader enrolls the team after minimum size is met.
6. View registrations, team details, round progress, results, points, and leaderboard.

## Event Lifecycle

1. Draft event is created by SuperAdmin.
2. Faculty incharges, rounds, restrictions, poster, and problem statements are configured.
3. Event is published and visible to eligible students.
4. Students register while registration is open and within configured dates.
5. Faculty conduct rounds.
6. Each round result is published separately.
7. Final round publishing completes the event and closes registration.
8. Faculty/Admin upload post-event media.
9. Reports and analytics use stored registrations, results, points, media, and event metadata.

## Registration Flow

Individual events create one auto-approved `REGISTERED` row.

Team events use team codes. Team leader registers the team after minimum team size is satisfied. Registration creates one `REGISTERED` row per member and locks the team.

If active problem statements exist, individual students or team leaders must select one before registration.

## Round Flow

Non-final rounds use qualification/disqualification only and do not generate final points.

Final rounds use final result labels: `WINNER`, `RUNNER_UP`, `SECOND_RUNNER_UP`, `PARTICIPANT`, and `DISQUALIFIED`.

Published rounds become read-only.

## Result And Points Flow

Final results generate `student_points`. Department scoring is naturally fair for mixed teams because points are awarded per student and each row carries the student's department.

Students can see final results only after result publishing.

## Reports

Reports are generated on demand. Generated files are not permanently stored. Admin can generate all reports. Faculty can generate assigned event reports and department reports only when department monitoring is enabled.

## Notifications

Notifications are stored in the database. The topbar bell shows recent notifications and unread counts. Email is disabled by default locally. WebSocket is configured with REST fallback behavior.

## Common Troubleshooting

- Backend not reachable: check `GET /api/health`, port `8080`, and `NEXT_PUBLIC_API_URL`.
- Admin analytics partial failure: inspect the section error and exact endpoint URL.
- CORS errors: set `FRONTEND_ORIGIN` to the exact frontend URL.
- Login fails after fresh DB: confirm Flyway migrations completed and use local dev credentials from `README.md`.
- Upload fails: check `UPLOAD_ROOT_DIR` permissions and file size/type.
- Faculty cannot open event: confirm the faculty is assigned in `event_incharges`.
- Student cannot register: check event status, registration dates, restrictions, capacity, and problem statement selection.
