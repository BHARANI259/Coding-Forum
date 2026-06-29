# kec-coding-forum

Kongu Engineering College Coding Forum monorepo.

## Tech Stack

- Backend: Java 21, Spring Boot, Spring Web, Spring Security, Spring Data JPA, Flyway, PostgreSQL
- Frontend: Next.js, TypeScript, Tailwind CSS, App Router
- Future utilities included: Apache POI for Excel import, OpenPDF for PDF reports

## Structure

```text
kec-coding-forum/
|-- server/
|-- client/
|-- README.md
`-- .gitignore
```

## Prerequisites

- Java 21
- Maven or the generated Maven wrapper
- Node.js and npm
- PostgreSQL

## Database Setup

Default backend connection:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kec_coding_forum
DB_USER=postgres
DB_PASSWORD=dharsini@3031
```

Create the database and app user:

```powershell
psql -h localhost -U postgres -d postgres -f server/db/postgres_setup.sql
```

To reset the database during development:

```sql
DROP DATABASE IF EXISTS kec_coding_forum;
```

Then rerun `server/db/postgres_setup.sql` and start the backend so Flyway reapplies migrations.

## Backend

```powershell
cd server
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

Health check:

```text
GET http://localhost:8080/api/health
```

## Frontend

```powershell
cd client
npm install
npm run build
npm run dev
```

## Development Login Accounts

Seeded development-only accounts:

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

All three are seeded through Flyway with BCrypt password hashes. They are for local development only.

## Authentication Routes

Frontend portal routes:

```text
/auth/student/login
/auth/faculty/login
/auth/admin/login
/auth/change-password
```

Backend authentication endpoints:

```text
POST /api/auth/student/login
POST /api/auth/faculty/login
POST /api/auth/admin/login
GET  /api/auth/me
POST /api/auth/change-password
```

Each login endpoint validates both credentials and the selected portal role.

## Block Roadmap

1. New project foundation, schema, seed data, health endpoint, frontend shell
2. Authentication and first-login password flow
3. SuperAdmin user creation/import
4. Team creation and join code flow
5. Event management, constraints, registration, and result tagging
6. Points and leaderboard
