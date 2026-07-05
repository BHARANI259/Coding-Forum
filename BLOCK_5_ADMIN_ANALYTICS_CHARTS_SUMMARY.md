# Block 5 - Admin Analytics Charts and Dashboard Improvements

## Backend endpoints added

All endpoints are SuperAdmin-protected under `/api/admin/analytics`.

- `GET /overview`
- `GET /department-participation`
- `GET /department-points`
- `GET /category-participation`
- `GET /registration-trend`
- `GET /result-distribution`
- `GET /technical-area-participation`
- `GET /event-status-summary`
- `GET /top-students`
- `GET /top-departments`
- `GET /event-engagement`
- `GET /filters`

Existing compatibility endpoints were kept:

- `GET /summary`
- `GET /departments`
- `GET /categories`
- `GET /recent-activity`

## Backend files changed/created

- Updated `AdminAnalyticsController`
- Rebuilt `AdminAnalyticsService` with live aggregate SQL queries
- Added DTOs for chart rows, top lists, event engagement, status summary, and filter metadata
- Extended `AdminAnalyticsSummaryDto` with completed events, problem statements, and event media counts

## Query/date-filter behavior

- Department participation uses `registrations.registered_at`.
- Registration trend uses `registrations.registered_at`; default range is last 30 days when `fromDate` is omitted.
- Department points and top student point totals use `student_points.created_at`.
- Result distribution uses `results.declared_at`.
- Department scoring uses `student_points.department_id`/student department data, so mixed-team scoring remains fair because each student has their own point row.
- Filters are ignored cleanly by endpoints where they do not logically apply.

## Frontend changes

- Installed `recharts`.
- Updated `/admin/dashboard` as an executive summary page:
  - overview stat cards
  - top departments preview
  - top students preview
  - event engagement preview
  - `View Full Analytics` action
- Rebuilt `/admin/analytics` with:
  - overview cards
  - filter bar
  - department participation bar chart
  - department points bar chart
  - category participation donut chart
  - registration trend line chart
  - result distribution donut chart
  - software/hardware participation donut chart
  - event status donut chart
  - event engagement table
  - top students table
  - top departments table

## Security rules

- Backend uses `@PreAuthorize("hasRole('SUPER_ADMIN')")` on admin analytics controller.
- Faculty smoke test against `/api/admin/analytics/overview` returned `403`.
- Student smoke test could not complete because local student login attempts returned `401` with the available dev passwords.

## Validation command results

- Backend: `./mvnw.cmd clean compile -DskipTests` passed.
- Frontend: `npm.cmd exec tsc -- --noEmit` passed.
- Frontend: `npm.cmd run lint` passed.
- Frontend: `npm.cmd run build` passed.
- Backend startup: `./mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"` started successfully with PostgreSQL/Flyway healthy.

## API smoke test results

SuperAdmin login used:

- `keccodingforum@kongu.edu`
- `Codingforum@2428`

Results:

- `/admin/analytics/overview` OK
- `/admin/analytics/department-participation` OK
- `/admin/analytics/department-points` OK
- `/admin/analytics/category-participation` OK
- `/admin/analytics/registration-trend` OK
- `/admin/analytics/result-distribution` OK
- `/admin/analytics/technical-area-participation` OK
- `/admin/analytics/event-status-summary` OK
- `/admin/analytics/top-students` OK
- `/admin/analytics/top-departments` OK
- `/admin/analytics/event-engagement` OK
- `/admin/analytics/filters` OK

Faculty access check:

- Faculty login succeeded with `faculty@kongu.edu` / `bharani@2007`.
- Faculty request to `/api/admin/analytics/overview` returned `403`.

Student access check:

- `student@kongu.edu` login returned `401` for `ashu@2007`, `dharsini@3031`, and `Student@123` in this local database, so student forbidden check is pending until a valid local student credential is confirmed.

## Intentionally not implemented

- PDF/Excel reports
- notifications
- WebSocket/email
- scheduled analytics
- public analytics page
- student/faculty analytics dashboards beyond existing pages
- Redis/external caching
