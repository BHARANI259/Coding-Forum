# KEC Coding Forum

Kongu Engineering College Coding Forum is a role-based academic event management portal for coding forum events, registrations, teams, rounds, results, points, leaderboards, analytics, reports, notifications, and post-event archive media.

## Stack

- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA, Flyway, PostgreSQL
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, Recharts
- Reports/files: OpenPDF, Apache POI, local upload storage

## Folder Structure

```text
kec-coding-forum/
|-- client/          Next.js frontend
|-- server/          Spring Boot backend
|-- server/db/       PostgreSQL setup helper
|-- server/uploads/  Local development uploads
`-- BLOCK_*          Block implementation summaries
```

## Prerequisites

- Java 21
- Node.js 20+ and npm
- PostgreSQL 14+
- PowerShell or a compatible shell

## Database Setup

Create the local database and application user:

```powershell
psql -h localhost -U postgres -d postgres -f server/db/postgres_setup.sql
```

Default local database values match `server/db/postgres_setup.sql`:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kec_coding_forum
DB_USER=kec_forum_app
DB_PASSWORD=kec_forum_pass
```

Flyway runs automatically on backend startup. Hibernate is configured with `ddl-auto=validate`, so schema changes must be handled through migrations.

## Backend Setup

```powershell
cd server
copy .env.example .env
.\mvnw.cmd clean compile -DskipTests
.\mvnw.cmd spring-boot:run
```

Health check:

```text
GET http://localhost:8080/api/health
```

Important backend environment variables:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MINUTES
FRONTEND_ORIGIN
UPLOAD_ROOT_DIR
EVENT_POSTERS_DIR
EVENT_MEDIA_DIR
NOTIFICATION_EMAIL_ENABLED
NOTIFICATION_WEBSOCKET_ENABLED
MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
```

## Frontend Setup

```powershell
cd client
copy .env.local.example .env.local
npm install
npm exec tsc -- --noEmit
npm run build
npm run dev
```

Frontend environment:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Development Login Accounts

These accounts are seeded for local development/demo only:

```text
SuperAdmin
Email: keccodingforum@kongu.edu
Password: Codingforum@2428

Student
Email: student@kongu.edu
Password: ashu@2007

Faculty
Email: faculty@kongu.edu
Password: bharani@2007
```

Change production passwords immediately after deployment.

## Main Routes

```text
/auth/admin/login
/auth/faculty/login
/auth/student/login
/admin/dashboard
/admin/events
/admin/analytics
/faculty/dashboard
/faculty/events
/student/dashboard
/student/events
```

## Build Commands

Backend:

```powershell
cd server
.\mvnw.cmd clean compile -DskipTests
.\mvnw.cmd test
```

Frontend:

```powershell
cd client
npm exec tsc -- --noEmit
npm run build
npm run lint
```

## Deployment Notes

- Use environment variables for database credentials, JWT secret, CORS origin, SMTP, and upload paths.
- Do not commit `.env`, `.env.local`, generated uploads, or production secrets.
- Ensure the upload root is persistent on the backend host.
- Set `FRONTEND_ORIGIN` to the deployed frontend URL.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend `/api` base URL.

See `DEPLOYMENT.md`, `HANDOVER.md`, and `DEMO_SCRIPT.md` for deployment and review guidance.
