# Block 4 - Admin User Management Summary

## Scope Completed

- Added SuperAdmin-only department, student, and faculty management APIs.
- Added manual student creation with linked STUDENT user account.
- Added manual faculty creation with linked FACULTY user account.
- Added CSV/XLSX student import.
- Added CSV/XLSX faculty import.
- Added first-login password requirement for created/imported students and faculty.
- Added frontend admin pages for departments, students, and faculty inside the existing KEC portal shell.
- Did not implement events, teams, registration, results, leaderboard, reports, notifications, WebSocket, or email logic.

## Backend Endpoints Added

- `GET /api/admin/departments`
- `POST /api/admin/departments`
- `GET /api/admin/students`
- `POST /api/admin/students`
- `POST /api/admin/students/import`
- `GET /api/admin/faculty`
- `POST /api/admin/faculty`
- `POST /api/admin/faculty/import`

All endpoints are protected with `@PreAuthorize("hasRole('SUPER_ADMIN')")`.

## Backend Files Added

- `server/src/main/java/com/kec/codingforum/admin/AdminDepartmentController.java`
- `server/src/main/java/com/kec/codingforum/admin/AdminStudentController.java`
- `server/src/main/java/com/kec/codingforum/admin/AdminFacultyController.java`
- `server/src/main/java/com/kec/codingforum/admin/DepartmentService.java`
- `server/src/main/java/com/kec/codingforum/admin/StudentAdminService.java`
- `server/src/main/java/com/kec/codingforum/admin/StudentImportService.java`
- `server/src/main/java/com/kec/codingforum/admin/FacultyAdminService.java`
- `server/src/main/java/com/kec/codingforum/admin/FacultyImportService.java`
- `server/src/main/java/com/kec/codingforum/admin/AdminMapping.java`
- `server/src/main/java/com/kec/codingforum/admin/dto/*`
- `server/src/main/java/com/kec/codingforum/admin/util/CsvImportUtil.java`
- `server/src/main/java/com/kec/codingforum/admin/util/ExcelImportUtil.java`
- `server/src/main/java/com/kec/codingforum/admin/util/ImportRow.java`
- `server/src/main/java/com/kec/codingforum/admin/util/TemporaryPasswordGenerator.java`

## Backend Files Updated

- Enabled method security in `SecurityConfig`.
- Added repository helpers for duplicate checks, linked user lookup, department lookup, and filtered listing.
- Added clean `IllegalArgumentException` handling as HTTP 400 in `GlobalExceptionHandler`.

## Identity Rules Implemented

- `users.id` remains the authentication identity.
- `students.id` remains the student profile identity.
- `faculties.id` remains the faculty profile identity.
- Student creation inserts `students` first, then `users` with `role = STUDENT`, `student_id`, and null `faculty_id`.
- Faculty creation inserts `faculties` first, then `users` with `role = FACULTY`, `faculty_id`, and null `student_id`.

## Password Rules

- Created/imported student temporary password: register number.
- Created/imported faculty temporary password: faculty code when present, otherwise generated temporary password.
- Passwords are stored only as BCrypt hashes.
- Temporary passwords are returned only in create/import responses for admin convenience.
- `first_login_required = true` is set for every created/imported student and faculty user.

## Import Format

Student CSV/XLSX required columns:

```csv
registerNumber,name,email,departmentCode,year,section,placementWilling
```

Faculty CSV/XLSX required columns:

```csv
facultyCode,name,email,departmentCode,deptMonitoringEnabled
```

Sample files:

- `server/sample-data/students_import_sample.csv`
- `server/sample-data/faculty_import_sample.csv`

## Frontend Pages Added or Updated

- `client/app/admin/departments/page.tsx`
- `client/app/admin/students/page.tsx`
- `client/app/admin/faculty/page.tsx`
- Added `Departments` to SuperAdmin navigation.
- Added admin API helpers in `client/lib/api.ts`.

## Frontend Features

- Department list and create form.
- Student filters: search, department, year, section, placement willing.
- Student manual create form with temporary password display.
- Student CSV/XLSX import with summary, created passwords, and row errors.
- Faculty filters: search, department, department monitoring enabled.
- Faculty manual create form with temporary password display.
- Faculty CSV/XLSX import with summary, created passwords, and row errors.

## API Test Examples

Login as SuperAdmin:

```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@kongu.edu\",\"password\":\"Admin@123\"}"
```

Create department:

```bash
curl -X POST http://localhost:8080/api/admin/departments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"CSD\",\"name\":\"Computer Science and Design\"}"
```

Create student:

```bash
curl -X POST http://localhost:8080/api/admin/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"registerNumber\":\"22CSR010\",\"name\":\"Test Student\",\"email\":\"22csr010@kongu.edu\",\"departmentId\":1,\"year\":3,\"section\":\"A\",\"placementWilling\":true}"
```

Import students:

```bash
curl -X POST http://localhost:8080/api/admin/students/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@server/sample-data/students_import_sample.csv"
```

Create faculty:

```bash
curl -X POST http://localhost:8080/api/admin/faculty \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"facultyCode\":\"FAC010\",\"name\":\"Test Faculty\",\"email\":\"fac010@kongu.edu\",\"departmentId\":1,\"deptMonitoringEnabled\":true}"
```

Import faculty:

```bash
curl -X POST http://localhost:8080/api/admin/faculty/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@server/sample-data/faculty_import_sample.csv"
```

Wrong-role protection test:

```bash
curl http://localhost:8080/api/admin/students \
  -H "Authorization: Bearer <student-or-faculty-token>"
```

Expected result: HTTP 403.

## Validation Commands Run

Backend:

- `.\mvnw.cmd clean compile`
  - Failed first because `JAVA_HOME` was not set.
- `java -version`
  - Passed. Java 21 is installed.
- `mvn clean compile`
  - First failed because network access was blocked and Spring dependencies were not cached.
  - Retried after network access was granted.
  - Failed at resources phase because Windows denied creating `server\target\classes`.
- `New-Item -ItemType Directory -Path target\classes -Force`
  - Failed with access denied for `server\target`.
- `mvn "-Dproject.build.outputDirectory=D:\KonguCodingForum\.build\server-classes" "-Dproject.build.testOutputDirectory=D:\KonguCodingForum\.build\server-test-classes" compile`
  - Failed because Maven still attempted to create `server\target\classes`.

Frontend:

- `npm run type-check`
  - Passed.
- `npm run lint`
  - Initially failed because ESLint scanned generated `.next` files after an ignore config mistake.
  - Fixed `eslint.config.mjs`.
  - Passed after fix.
- `npm run build`
  - Started, printed the Next.js banner, then hung with no further diagnostics. This matches the earlier local Block 3.5 build-hang behavior.
  - The hung build-era Node processes were stopped after verification; older Node processes likely belonging to the dev server were left alone.

## Known Pending Items

- Backend compile still needs to be rerun after fixing local Windows permission on `server\target`.
- Frontend `npm run build` still needs a clean local run after resolving the existing Next build hang.
- Runtime API testing with PostgreSQL was not completed because backend compile/start could not complete in this environment.
- No event, team, registration, result, leaderboard, report, notification, WebSocket, or email modules were added in this block.
