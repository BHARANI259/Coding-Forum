# Block 2 - Role-Separated Authentication Summary

## Scope Completed

- Implemented JWT authentication with separate Student, Faculty, and SuperAdmin login endpoints.
- Added role validation so accounts cannot use the wrong portal.
- Added current-user and first-login password-change endpoints.
- Added frontend portal selector, three explicit login pages, first-login password-change page, and placeholder protected dashboards.
- No event CRUD, teams, results, leaderboard, reports, notifications, WebSocket, or registration logic was implemented.

## Backend Files Created/Updated

- `server/src/main/java/com/kec/codingforum/auth/AuthController.java`
- `server/src/main/java/com/kec/codingforum/auth/AuthService.java`
- `server/src/main/java/com/kec/codingforum/auth/AuthException.java`
- `server/src/main/java/com/kec/codingforum/auth/LoginRequest.java`
- `server/src/main/java/com/kec/codingforum/auth/LoginResponse.java`
- `server/src/main/java/com/kec/codingforum/auth/ChangePasswordRequest.java`
- `server/src/main/java/com/kec/codingforum/auth/CurrentUserResponse.java`
- `server/src/main/java/com/kec/codingforum/auth/UserRole.java`
- `server/src/main/java/com/kec/codingforum/security/CustomUserPrincipal.java`
- `server/src/main/java/com/kec/codingforum/security/CustomUserDetailsService.java`
- `server/src/main/java/com/kec/codingforum/security/JwtService.java`
- `server/src/main/java/com/kec/codingforum/security/JwtAuthenticationFilter.java`
- `server/src/main/java/com/kec/codingforum/security/SecurityUtils.java`
- `server/src/main/java/com/kec/codingforum/config/SecurityConfig.java`
- `server/src/main/java/com/kec/codingforum/common/ApiErrorResponse.java`
- `server/src/main/java/com/kec/codingforum/common/GlobalExceptionHandler.java`
- `server/src/main/resources/application.yml`
- `server/src/main/resources/db/migration/V3__seed_auth_users.sql`
- `server/pom.xml`

## Backend Endpoints Created

```text
POST /api/auth/student/login
POST /api/auth/faculty/login
POST /api/auth/admin/login
GET  /api/auth/me
POST /api/auth/change-password
```

## Frontend Routes Created

```text
/
/auth/student/login
/auth/faculty/login
/auth/admin/login
/auth/change-password
/student/dashboard
/faculty/dashboard
/admin/dashboard
```

The old generic `/auth/login` source page was removed.

## Default Test Accounts

```text
SuperAdmin: admin@kongu.edu / Admin@123
Student:    student@kongu.edu / Student@123
Faculty:    faculty@kongu.edu / Faculty@123
```

These accounts are development-only and are seeded with BCrypt hashes.

## Curl/Postman Tests

Student login:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/api/auth/student/login `
  -ContentType 'application/json' `
  -Body '{"email":"student@kongu.edu","password":"Student@123"}'
```

Faculty login:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/api/auth/faculty/login `
  -ContentType 'application/json' `
  -Body '{"email":"faculty@kongu.edu","password":"Faculty@123"}'
```

SuperAdmin login:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/api/auth/admin/login `
  -ContentType 'application/json' `
  -Body '{"email":"admin@kongu.edu","password":"Admin@123"}'
```

Wrong-role rejection:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/api/auth/faculty/login `
  -ContentType 'application/json' `
  -Body '{"email":"student@kongu.edu","password":"Student@123"}'
```

Expected result: `401 AUTH_ERROR` with `This account is not allowed to use the Faculty portal.`

## Command Results

Backend compile:

```text
./mvnw.cmd "-Dmaven.build.dir=D:\KonguCodingForum\.build-test\server-target" compile
BUILD SUCCESS
```

Backend start:

```text
./mvnw.cmd "-Dmaven.build.dir=D:\KonguCodingForum\.build-test\server-target" spring-boot:run
Started on port 8080
```

DB migration:

```text
Successfully validated 3 migrations
Schema public migrated to version 3 on first run
Schema public is up to date on restart
```

Backend endpoint validation:

```text
student@kongu.edu role=STUDENT studentId=1 firstLogin=True
faculty@kongu.edu role=FACULTY facultyId=1 deptMonitoring=True firstLogin=True
admin@kongu.edu role=SUPER_ADMIN firstLogin=True
Wrong student-on-faculty login: 401 AUTH_ERROR
Wrong faculty-on-student login: 401 AUTH_ERROR
GET /api/auth/me returned student@kongu.edu role=STUDENT
POST /api/auth/change-password succeeded; dev password was restored
```

Frontend TypeScript validation:

```text
npm.cmd exec tsc -- --noEmit
Passed
```

Frontend production build:

```text
npm.cmd run build
Did not complete in this environment. The process repeatedly hung after the Next.js 15.5.19 banner with no build-phase output.
```

Frontend dev route validation:

```text
npm.cmd run dev
Did not complete route rendering in this environment because the Next.js dev process showed the same hang as production build.
```

## Pending Work

- Resolve the local Next.js 15.5.19 build/dev hang or refresh `node_modules` once the `node_modules/@img` permission issue is cleared.
- Browser-level validation of redirects and logout could not run because the in-app browser runtime could not start with the current sandbox AppData permission state.
- Block 3 can begin only after the frontend build runner issue is fixed.
