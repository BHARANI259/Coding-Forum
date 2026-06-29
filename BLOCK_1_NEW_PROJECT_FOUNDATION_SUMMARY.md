# Block 1 New Project Foundation Summary

## Created Structure

- `server/` Spring Boot backend
- `client/` Next.js frontend
- `README.md`
- `.gitignore`

## Backend Dependencies

- Java 21
- Spring Boot Web, Security, Data JPA, Validation
- PostgreSQL driver
- Flyway
- Lombok
- JJWT
- Apache POI
- OpenPDF

## Frontend Dependencies

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostCSS and Autoprefixer

## Database Credentials

- Database: `kec_coding_forum`
- Default app connection: `postgres` / `dharsini@3031`
- Setup script app user: `kec_forum_app` / `kec_forum_pass`

## Migration Files Created

- `server/src/main/resources/db/migration/V1__init_schema.sql`
- `server/src/main/resources/db/migration/V2__seed_basic_data.sql`

## How To Reset DB

Run:

```sql
DROP DATABASE IF EXISTS kec_coding_forum;
```

Then rerun:

```powershell
psql -h localhost -U postgres -d postgres -f server/db/postgres_setup.sql
```

Start the backend again so Flyway applies the migrations.

## Commands Run

- `mvn -N wrapper:wrapper`
- `mvn -N wrapper:wrapper -Dtype=bin`
- `.\mvnw.cmd clean compile`
- `psql -h localhost -U postgres -d postgres -f server\db\postgres_setup.sql`
- `DROP DATABASE IF EXISTS kec_coding_forum`
- `.\mvnw.cmd spring-boot:run`
- `GET http://localhost:8080/api/health`
- `npm.cmd install --cache D:\KonguCodingForum\.npm-cache`
- `npm.cmd run build`

## Command Results

- Backend compile: passed with Maven wrapper after setting `JAVA_HOME` for the command. The first wrapper attempt failed because `JAVA_HOME` was not set in the shell environment.
- Backend run: started successfully on port `8080`; Flyway validated/applied migrations against PostgreSQL and Hibernate `ddl-auto=validate` passed. The first run attempt failed because the local database still had old Flyway history, then passed after resetting the dev database.
- Health check: passed with `status=UP`, `app=kec-coding-forum`.
- DB setup: passed. The local `kec_coding_forum` database had old Flyway history, so it was dropped and recreated for this fresh Block 1 validation.
- Frontend install: passed using workspace-local npm cache.
- Frontend build: passed with `npm.cmd run build`.
- Notes: `npm install` reported 2 moderate dependency advisories. Spring Boot run was manually stopped after health verification, so Maven reported process termination after the successful runtime check.

## Intentionally Not Implemented Yet

- Login/authentication business flow
- JWT issuing and validation flow
- User import APIs
- Dashboards
- Event pages
- Team creation/joining logic
- Registration services
- Results workflow beyond schema
- Notifications
- Mandatory-event penalties
- Result-change approvals
- Round-wise scoring
