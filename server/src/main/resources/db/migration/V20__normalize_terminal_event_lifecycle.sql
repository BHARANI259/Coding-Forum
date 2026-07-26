-- Repair legacy rows that predate the enforced event lifecycle.
UPDATE events
SET status = 'COMPLETED',
    registration_open = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE results_published = TRUE
  AND (status <> 'COMPLETED' OR registration_open = TRUE);

UPDATE events
SET registration_open = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('COMPLETED', 'CANCELLED')
  AND registration_open = TRUE;

-- The application database role may not own legacy tables in hosted or shared
-- installations, so this repair deliberately avoids ALTER TABLE. Event
-- lifecycle invariants are enforced transactionally by EventAdminService,
-- EventRoundService, and EventRoundResultService.
