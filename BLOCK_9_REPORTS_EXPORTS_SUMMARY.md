# Block 9 - Reports and Exports Summary

## Backend endpoints added

Admin report endpoints:

- `GET /api/admin/reports/events/{eventId}/pdf`
- `GET /api/admin/reports/events/{eventId}/students.xlsx`
- `GET /api/admin/reports/events/{eventId}/teams.xlsx`
- `GET /api/admin/reports/events/{eventId}/results.xlsx`
- `GET /api/admin/reports/departments/{departmentId}/pdf`
- `GET /api/admin/reports/departments/{departmentId}/students.xlsx`
- `GET /api/admin/reports/leaderboard/college.xlsx`

Faculty report endpoints:

- `GET /api/faculty/reports/events/{eventId}/pdf`
- `GET /api/faculty/reports/events/{eventId}/students.xlsx`
- `GET /api/faculty/reports/events/{eventId}/teams.xlsx`
- `GET /api/faculty/reports/events/{eventId}/results.xlsx`
- `GET /api/faculty/reports/department/pdf`
- `GET /api/faculty/reports/department/students.xlsx`

## Report services created

- `ReportDataService`
- `PdfReportService`
- `ExcelReportService`
- `AdminReportController`
- `FacultyReportController`
- `ReportModels`

Repository read helpers were added for report queries:

- event points by event
- department points by department
- teams by event
- students by department

## PDF sections included

Event PDF:

- college/report header
- event summary
- restrictions
- faculty incharges
- problem statements
- rounds
- participation summary
- participants or teams
- results
- department summary

Department PDF:

- department summary
- total students and active students
- participations
- total points
- wins and runner-ups
- category-wise performance
- top students

## Excel exports included

Event students workbook:

- `Event Summary`
- `Students`

Event teams workbook:

- `Event Summary`
- `Teams`
- `Team Members`

Event results workbook:

- `Results`
- `Points`

Department student workbook:

- `Department Students`

College leaderboard workbook:

- `College Leaderboard`

Excel files use bold headers, frozen header rows, and auto-sized columns.

## Frontend pages updated

- `/admin/reports`
- `/faculty/reports`
- `/admin/events/[id]`
- `/faculty/events/[id]`

## Frontend download handling

Added authenticated blob download helpers in `client/lib/api.ts`.

The helpers:

- attach JWT authorization
- read the response as a blob
- use `Content-Disposition` filename when available
- trigger browser download
- show clean UI errors on failure

## Security rules

- SuperAdmin can generate all reports.
- Faculty can generate event reports only for assigned events.
- Faculty department reports require `deptMonitoringEnabled = true`.
- Students have no report generation access.

## Validation command results

Backend:

- `./mvnw.cmd clean compile -DskipTests` - passed.
- `./mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run` - started successfully on port `8081`; it was manually stopped after smoke testing, so Maven reported process terminated with exit code `-1`.
- Flyway validated 7 migrations and reported schema up to date.

Frontend:

- `npm.cmd exec tsc -- --noEmit` - passed.
- `npm.cmd run lint` - passed.
- `npm.cmd run build` - started but hung after the Next.js banner, matching the earlier local build hang behavior. The Node process was stopped manually afterward.

## API smoke test results

With SuperAdmin `keccodingforum@kongu.edu`:

- Downloaded event PDF for event `6`.
- Downloaded event student Excel for event `6`.
- Downloaded college leaderboard Excel.
- Downloaded department PDF for department `7`.

With Faculty `faculty@kongu.edu`:

- Downloaded assigned event results Excel for event `6`.

With Student `student@kongu.edu`:

- Attempt to access admin report endpoint returned `403`.

## Known pending items

Intentionally not implemented in Block 9:

- notifications
- email delivery
- WebSocket
- certificate generation
- report file storage
- scheduled reports
- advanced chart exports
- round-wise scoring
- complex result-change approval workflow
