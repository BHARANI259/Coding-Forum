# Deployment Guide

This project can be deployed to any platform that supports Java 21, Node.js, PostgreSQL, and persistent file storage for uploads.

## Recommended Options

- Backend: Render, Railway, VPS, or college server
- Frontend: Vercel, Netlify, VPS, or same server
- Database: Supabase Postgres, Railway Postgres, or college PostgreSQL server

## Backend Deployment

### Requirements

- Java 21
- PostgreSQL
- Writable persistent upload directory

### Build

```powershell
cd server
.\mvnw.cmd clean package -DskipTests
```

### Run

```powershell
java -jar target/coding-forum-0.0.1-SNAPSHOT.jar
```

### Backend Environment Variables

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JDBC_DATABASE_URL
JWT_SECRET
JWT_EXPIRATION_MINUTES
FRONTEND_ORIGIN
UPLOAD_ROOT_DIR
EVENT_POSTERS_DIR
EVENT_MEDIA_DIR
NOTIFICATION_EMAIL_ENABLED
NOTIFICATION_WEBSOCKET_ENABLED
NOTIFICATION_FROM_NAME
MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
CSP_REPORT_ONLY
RATE_LIMIT_ENABLED
RATE_LIMIT_LOGIN_MAX_ATTEMPTS
RATE_LIMIT_LOGIN_WINDOW_SECONDS
RATE_LIMIT_PASSWORD_MAX_ATTEMPTS
RATE_LIMIT_PASSWORD_WINDOW_SECONDS
```

Set `FRONTEND_ORIGIN` to the deployed frontend origin, for example:

```text
https://your-frontend-domain.edu
```

For multiple local origins during development:

```text
http://localhost:3000,http://127.0.0.1:3000
```

For Neon or other hosted PostgreSQL databases, prefer:

```text
JDBC_DATABASE_URL=jdbc:postgresql://your-host/your-db?sslmode=require
DB_USER=your-provider-user
DB_PASSWORD=your-provider-password
APP_TIME_ZONE=Asia/Kolkata
```

If `JDBC_DATABASE_URL` is set, it overrides the composed local URL built from `DB_HOST`, `DB_PORT`, and `DB_NAME`.

### Upload Storage

`UPLOAD_ROOT_DIR` must point to a persistent writable directory.

The application stores:

- event posters under `EVENT_POSTERS_DIR`
- post-event media under `EVENT_MEDIA_DIR`

Do not use temporary build directories for uploads in production.

## Frontend Deployment

### Build

```powershell
cd client
npm install
npm run build
```

### Start

```powershell
npm start
```

### Frontend Environment Variables

```text
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

The value must include `/api`.

## Database Deployment

1. Create PostgreSQL database.
2. Create application user.
3. Grant schema permissions.
4. Set backend DB environment variables.
5. Start backend and allow Flyway to apply migrations.

For local setup, use:

```powershell
psql -h localhost -U postgres -d postgres -f server/db/postgres_setup.sql
```

## Production Checklist

- Replace default dev credentials.
- Set strong `JWT_SECRET`.
- Set `FRONTEND_ORIGIN` to the exact frontend URL.
- Set `NEXT_PUBLIC_API_URL` to the backend API URL.
- Keep `RATE_LIMIT_ENABLED=true` unless a gateway/WAF already provides equivalent login throttling.
- Keep `CSP_REPORT_ONLY` in report-only mode until violations are reviewed in production logs/browser console.
- Ensure upload directory is persistent.
- Keep email disabled unless SMTP is configured.
- Confirm `GET /api/health` returns `UP`.
- Confirm frontend login works for each role.
- Confirm file uploads work on the deployment host.

## Common Errors

### Cannot reach backend

Check:

- backend process is running
- `NEXT_PUBLIC_API_URL` points to the backend `/api`
- backend CORS `FRONTEND_ORIGIN` matches the frontend origin
- firewall/platform allows the backend port

### Flyway migration failure

Check:

- database user has schema permissions
- migrations were not edited after being applied
- the target database is not partially migrated from a different branch

### Uploads disappear after restart

The upload root is not persistent. Configure a volume or permanent directory.

### Faculty cannot access event

Confirm the faculty is assigned as an event incharge in Admin > Event Incharges.
