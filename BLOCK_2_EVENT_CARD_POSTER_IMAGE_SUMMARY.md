# Block 2 - Event Card Redesign with Flyer/Poster Image

## Database Migration

- Added `V13__event_poster_images.sql`.
- Added nullable poster metadata columns to `events`:
  - `poster_image_url`
  - `poster_original_name`
  - `poster_content_type`
  - `poster_size_bytes`
  - `poster_uploaded_at`

## Backend Changes

- Added poster metadata fields to `Event`.
- Updated event list/detail DTOs to include poster metadata for admin, faculty, and student APIs.
- Added `EventPosterService` for local poster storage and validation.
- Added admin poster endpoints:
  - `POST /api/admin/events/{eventId}/poster`
  - `DELETE /api/admin/events/{eventId}/poster`
- Added public poster endpoint:
  - `GET /api/public/event-posters/{fileName}`
- Public poster reads are allowed through security config.
- Upload config added in `application.yml`:
  - `app.uploads.root-dir`
  - `app.uploads.event-posters-dir`
  - multipart max file/request size: `5MB`

## File Storage Behavior

- Posters are stored under `server/uploads/event-posters` by default.
- Stored filenames are generated safely as `event-{eventId}-{uuid}.{ext}`.
- Original filename is stored separately in the database.
- Existing poster files are deleted when replacing/removing if safe.
- File-system paths are not exposed to the frontend.

## Validation Rules

- Allowed poster content types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Max size: `5 MB`.
- Empty files, wrong content types, wrong extensions, and traversal filenames are rejected.
- Public serving validates filenames and serves only from the poster directory.

## Frontend Changes

- Added poster API helpers:
  - `uploadEventPoster(eventId, file)`
  - `removeEventPoster(eventId)`
- Added reusable components:
  - `EventPosterPreview`
  - `EventPosterUpload`
  - `StudentEventCard`
- Admin create/edit event form now supports optional poster selection.
- Admin edit form supports poster replace/remove.
- Shared event summary now displays poster preview.
- Student events page now uses poster-led visual cards instead of dense table-like cards.
- Faculty assigned events page now shows read-only poster cards.
- Cards fall back to a clean `KEC Coding Forum` placeholder when no poster exists.

## Validation Commands Run

Backend compile:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd clean compile -DskipTests
```

Result: `BUILD SUCCESS`

Backend startup / migration:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'; .\mvnw.cmd "-Dspring-boot.run.arguments=--server.port=8081" spring-boot:run
Invoke-RestMethod -Uri 'http://localhost:8081/api/health'
```

Result:

- Flyway validated 13 migrations.
- Applied `V13 - event poster images`.
- `/api/health` returned `UP`.
- The temporary backend was then stopped manually; Maven reported exit code `-1` because the process was intentionally terminated after validation.

Frontend:

```powershell
npm.cmd exec tsc -- --noEmit
npm.cmd run lint
npm.cmd run build
```

Results:

- TypeScript: passed.
- ESLint: passed.
- Next.js production build: passed.

## API Test Results

- Startup and Flyway migration were verified.
- Full upload/replace/remove API testing with a real event poster was not run to avoid changing existing event data during validation.

## Intentionally Not Implemented

- Post-event gallery/photo upload.
- Problem statement upgrades.
- Analytics charts.
- Reports.
- Notifications.
- Certificate generation.
