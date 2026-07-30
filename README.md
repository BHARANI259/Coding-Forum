# KEC Coding Forum

Role-based academic event management platform for Kongu Engineering College Coding Forum.

The KEC Coding Forum portal manages the full lifecycle of coding forum activities: student and faculty access, event setup, registrations, teams, rounds, problem statements, results, points, leaderboards, analytics, reports, notifications, and post-event archive media.

## Project Overview

This system is built for three primary roles:

| Role | Purpose |
| --- | --- |
| SuperAdmin | Configure departments, students, faculty, events, incharges, rounds, problem statements, analytics, reports, notifications, and archive media. |
| Faculty | Manage assigned events, round progression, result publishing, registrations, reports, and post-event media for events where they are incharge. |
| Student | Browse eligible events, register individually or as a team, track teams, view registrations, results, points, leaderboards, and notifications. |

The application follows a clean split between a Spring Boot backend API and a Next.js frontend portal.

## Core Features

- Role-separated authentication for SuperAdmin, Faculty, and Student users
- Admin management for departments, students, faculty, and event incharges
- Event creation with categories, restrictions, registration windows, capacity limits, posters, rounds, and problem statements
- Individual and team registration with auto-approved `REGISTERED` status
- Team code creation and joining flow
- Round-wise progression and round-wise result publishing
- Final result tagging with automatic points generation
- Student points, department points, leaderboards, and analytics
- Problem statements with multiple reference links
- Event poster/flyer upload for event promotion
- Post-event media upload for completed events
- PDF/Excel report support where implemented
- In-app notifications with optional WebSocket and email support where configured
- Profile and password management support

## Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| Database | PostgreSQL, Flyway migrations |
| Frontend | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, responsive portal layout |
| Charts | Recharts |
| Reports | OpenPDF, Apache POI |
| Files | Local upload storage with configurable upload root |
| Auth | JWT-based role authorization |

## Repository Structure

```text
kec-coding-forum/
|-- client/                       Next.js frontend application
|   |-- app/                      App Router pages
|   |-- components/               Shared UI and feature components
|   |-- lib/                      API clients and frontend utilities
|   `-- public/                   Static frontend assets
|
|-- server/                       Spring Boot backend application
|   |-- src/main/java/            Backend source code
|   |-- src/main/resources/       application.yml and Flyway migrations
|   |-- db/                       PostgreSQL setup helper
|   `-- uploads/                  Local development upload folder
|
|-- README.md                     Project setup and overview
|-- HANDOVER.md                   Functional handover guide
|-- DEMO_SCRIPT.md                Demo walkthrough
|-- DEPLOYMENT.md                 Deployment guide
`-- BLOCK_*_SUMMARY.md            Implementation block summaries
```

## Prerequisites

Install the following before running the project:

- Java 21
- Node.js 20 or later
- npm
- PostgreSQL 14 or later
- PowerShell, Command Prompt, or a compatible terminal

## Environment Files

The project uses environment files for local configuration. Do not commit real secrets.

Backend:

```powershell
cd server
copy .env.example .env
```

Frontend:

```powershell
cd client
copy .env.local.example .env.local
```

## Database Setup

### Local PostgreSQL

Create the local database and application user:

```powershell
psql -h localhost -U postgres -d postgres -f server/db/postgres_setup.sql
```

Default local values:

```text
JDBC_DATABASE_URL=jdbc:postgresql://localhost:5432/kec_coding_forum
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kec_coding_forum
DB_USER=kec_forum_app
DB_PASSWORD=kec_forum_pass
```

### Hosted PostgreSQL

For hosted providers such as Neon, Railway, Supabase, or a college PostgreSQL server, prefer setting a complete JDBC URL:

```text
JDBC_DATABASE_URL=jdbc:postgresql://host/database?sslmode=require
DB_USER=provider_user
DB_PASSWORD=provider_password
```

Keep hosted database credentials only in `server/.env` or deployment environment variables.

Flyway migrations run automatically on backend startup. Hibernate uses schema validation, so database changes must be handled through Flyway migrations.

## Backend Setup

From the project root:

```powershell
cd server
copy .env.example .env
.\mvnw.cmd clean compile -DskipTests
.\mvnw.cmd spring-boot:run
```

Backend API base URL:

```text
http://localhost:8080/api
```

Health check:

```text
GET http://localhost:8080/api/health
```

Important backend variables:

```text
JDBC_DATABASE_URL
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MINUTES
APP_TIME_ZONE
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
MAIL_CONNECTION_TIMEOUT
MAIL_TIMEOUT
MAIL_WRITE_TIMEOUT
MAIL_SSL_TRUST
```

### SMTP Email Sending

SMTP email is used by notification delivery when enabled. In-app notifications are still created even if SMTP is disabled or fails.

For Gmail SMTP, use an app password instead of your normal Gmail password:

```text
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_FROM_NAME=KEC Coding Forum
NOTIFICATION_FROM_ADDRESS=keccodingforum@kongu.edu
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=keccodingforum@kongu.edu
MAIL_PASSWORD=your-gmail-app-password
MAIL_SSL_TRUST=smtp.gmail.com
```

SuperAdmin can test SMTP after login:

```powershell
curl -X POST http://localhost:8080/api/admin/mail/test `
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" `
  -H "Content-Type: application/json" `
  -d "{\"to\":\"recipient@example.com\"}"
```

## Frontend Setup

From the project root:

```powershell
cd client
copy .env.local.example .env.local
npm install
npm run dev
```

Frontend application URL:

```text
http://localhost:3000
```

Frontend environment:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Development Login Accounts

These accounts are intended for local development and demo use only.

| Role | Email | Password |
| --- | --- | --- |
| SuperAdmin | `keccodingforum@kongu.edu` | `Codingforum@2428` |
| Faculty | `faculty@kongu.edu` | `bharani@2007` |
| Student | `student@kongu.edu` | `ashu@2007` |

Change all production credentials immediately after deployment.

## Main Application Routes

Authentication:

```text
/auth/admin/login
/auth/faculty/login
/auth/student/login
```

SuperAdmin:

```text
/admin/dashboard
/admin/events
/admin/event-incharges
/admin/students
/admin/faculty
/admin/leaderboard
/admin/analytics
/admin/reports
/admin/notifications
```

Faculty:

```text
/faculty/dashboard
/faculty/events
/faculty/results
/faculty/department-monitoring
/faculty/reports
/faculty/notifications
/faculty/profile
```

Student:

```text
/student/dashboard
/student/events
/student/teams
/student/registrations
/student/results
/student/leaderboard
/student/notifications
/student/profile
```

## Key Workflows

### Event Setup

1. SuperAdmin creates or edits an event.
2. SuperAdmin assigns one or more faculty incharges.
3. SuperAdmin uploads the event poster/flyer.
4. SuperAdmin configures rounds.
5. SuperAdmin adds problem statements and reference links when needed.
6. Event is published and becomes visible to eligible students.

### Student Registration

1. Student opens eligible event cards.
2. Student views event detail, restrictions, rounds, and problem statements.
3. Individual event: student registers directly with required problem statement selection.
4. Team event: student creates or joins a team using team code.
5. Team leader registers the team once minimum team size is satisfied.
6. Registrations are auto-approved with `REGISTERED` status.

### Round and Result Flow

1. Faculty manages only assigned events.
2. Non-final rounds use qualification/disqualification flow.
3. Each round has its own publish action.
4. Publishing a non-final round locks that round and moves qualified participants forward.
5. Final round result publishing generates points and completes the event.
6. Students can view final results only after final result publication.

### Analytics and Reports

- Analytics are calculated from live database data.
- `student_points` is the source of truth for points and performance.
- Reports and exports use event, registration, result, round, problem statement, and media data.
- Post-event media is available for archive and future report use.

## Validation Commands

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

Backend deployment requires:

- Java 21 runtime
- PostgreSQL connection
- Environment variables for database, JWT, CORS, uploads, and mail
- Persistent upload directory for posters and post-event media
- Flyway migrations enabled

Frontend deployment requires:

- Node.js compatible build environment
- `NEXT_PUBLIC_API_URL` pointing to the deployed backend `/api` URL
- Correct CORS origin configured in backend `FRONTEND_ORIGIN`

Recommended deployment options:

| Component | Options |
| --- | --- |
| Backend | College server, VPS, Render, Railway |
| Frontend | Vercel, Netlify, college server |
| Database | College PostgreSQL, Neon, Supabase, Railway PostgreSQL |
| Uploads | Persistent disk or mounted volume on backend host |

See [DEPLOYMENT.md](DEPLOYMENT.md) for the detailed deployment checklist.

## Security and Configuration Notes

- Do not commit `.env`, `.env.local`, production credentials, upload files, or generated secrets.
- Backend authorization must enforce every role boundary; frontend hiding is not a security control.
- Student users must not access admin or faculty APIs.
- Faculty users must access only assigned event management APIs.
- Public file access is limited to event poster images.
- Post-event media remains protected and must be fetched through authorized endpoints.
- SMTP email is disabled by default for local development.
- WebSocket notification failure should not break REST notification fallback.

## Troubleshooting

### Frontend cannot reach backend

Check:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
FRONTEND_ORIGIN=http://localhost:3000
```

Also verify Spring Boot is running:

```text
http://localhost:8080/api/health
```

### Port 8080 is already in use

Stop the existing process using port 8080 or run the backend with another port:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

Then update `NEXT_PUBLIC_API_URL` accordingly.

### Hosted database connection fails

Check:

- JDBC URL format starts with `jdbc:postgresql://`
- SSL mode is correct for the provider
- Database credentials are current
- Local network or college network allows outbound PostgreSQL connections
- Provider allows the current IP address if IP restrictions are enabled

### Flyway migration error

Do not edit old migrations. Add a new migration with the next version number and restart the backend.

## Supporting Documents

- [HANDOVER.md](HANDOVER.md): role-based functional handover
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md): review/demo walkthrough
- [DEPLOYMENT.md](DEPLOYMENT.md): deployment checklist and environment guide
- `BLOCK_*_SUMMARY.md`: feature implementation summaries

## Project Status

The project is in final review and deployment preparation stage. The completed system covers the main academic event lifecycle for KEC Coding Forum, including registration, teams, rounds, results, points, leaderboards, analytics, reports, notifications, and post-event archive preparation.
