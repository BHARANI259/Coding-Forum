# Block 4 - Post-Event Media Upload Summary

## Database Migration Changes

- Added `server/src/main/resources/db/migration/V15__event_media.sql`.
- Created `event_media` with event/user links, media metadata, authenticated file URL, upload timestamp, and soft-delete fields.
- Added indexes for event, uploader, media type, and deleted status.
- Added `app.uploads.event-media-dir` to `application.yml`.
- Increased multipart limits to support up to 10 images of 10 MB each per request.

## Backend Endpoints Added

Admin:

- `GET /api/admin/events/{eventId}/media`
- `POST /api/admin/events/{eventId}/media`
- `PATCH /api/admin/events/{eventId}/media/{mediaId}`
- `DELETE /api/admin/events/{eventId}/media/{mediaId}`
- `GET /api/admin/events/{eventId}/media/{mediaId}/file`

Faculty:

- `GET /api/faculty/events/{eventId}/media`
- `POST /api/faculty/events/{eventId}/media`
- `PATCH /api/faculty/events/{eventId}/media/{mediaId}`
- `DELETE /api/faculty/events/{eventId}/media/{mediaId}`
- `GET /api/faculty/events/{eventId}/media/{mediaId}/file`

## Backend Files Added

- `EventMedia`
- `EventMediaRepository`
- `EventMediaService`
- `AdminEventMediaController`
- `FacultyEventMediaController`
- `EventMediaDto`
- `UpdateEventMediaRequest`

## File Storage Behavior

- Files are stored under `uploads/event-media` by default.
- Stored filenames are generated with event id and UUID.
- Original filenames are stored separately.
- File paths are never exposed to the frontend.
- Image bytes are served only through authenticated admin/faculty endpoints.
- Delete is soft-delete in the database; the physical image is retained for traceability.

## Media Type Handling

Supported media types:

- `PHOTO`
- `GEOTAG_SCREENSHOT`
- `PARTICIPANT_GROUP`
- `WINNER_PHOTO`
- `EVENT_PROOF`
- `OTHER`

Supported file types:

- `image/jpeg`
- `image/png`
- `image/webp`

Limits:

- 10 MB per image.
- 10 files per upload request.
- 50 active media files per event.

## Frontend Updates

- Added `client/lib/api/eventMedia.ts`.
- Added `client/components/events/EventMediaManager.tsx`.
- Added Event Media / Post-Event Gallery section to `/admin/events/[id]`.
- Added Post-Event Media section to `/faculty/events/[id]`.

## Admin Media Management

- SuperAdmin can list, upload, edit metadata, delete, and view media for any event.
- Admin upload is allowed regardless of event status for correction/admin purposes.

## Faculty Upload Rules

- Faculty can list/view media only for assigned events.
- Faculty can upload only when event is completed or results are published.
- Faculty can edit/delete only media uploaded by their own user account.
- If the event is not completed, the upload UI is disabled and the backend rejects upload.

## Authenticated Image Loading

- Media metadata APIs return JSON only.
- The UI fetches each image as a protected blob using the JWT Authorization header.
- Blob object URLs are used for thumbnails and revoked on cleanup.
- Post-event media is not public.

## Report Integration Preparation

- Media metadata includes event id, media id, media type, caption, uploader, upload time, file URL, content type, and size.
- Report generation was not implemented in this block.

## Validation Command Results

- `./mvnw.cmd clean compile -DskipTests`: passed.
- `./mvnw.cmd spring-boot:run`: updated backend started successfully on port 8080 after stopping the old running backend.
- Flyway: successfully validated 15 migrations; schema version is 15.
- `npm.cmd exec tsc -- --noEmit`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## API Smoke Test Results

- Admin login with `keccodingforum@kongu.edu`: passed.
- `GET /api/admin/events/6/media`: returned empty active media list.
- Admin upload PNG smoke image: passed.
- Admin list after upload: returned 1 active media record.
- Admin update caption/type: passed.
- Admin authenticated file endpoint: returned `200 image/png`.
- Admin delete smoke media: passed.
- Admin list after delete: returned 0 active media records.

## Known Pending Items

- Faculty upload was implemented but not manually smoke-tested with a completed assigned event in this pass.
- No pagination for media lists yet; active media is capped at 50 per event.
- No thumbnail generation or image compression.

## Intentionally Not Implemented

- Analytics charts.
- PDF/Excel report generation.
- Notifications.
- Student public gallery.
- Certificate generation.
- Image compression/thumbnails.
