-- student_points is the scoring source of truth. Legacy event rows that
-- already awarded points must therefore represent a published, completed
-- event rather than an editable or cancelled event.
UPDATE events e
SET status = 'COMPLETED',
    registration_open = FALSE,
    results_published = TRUE,
    results_published_at = COALESCE(
        e.results_published_at,
        (SELECT MAX(sp.created_at) FROM student_points sp WHERE sp.event_id = e.id),
        CURRENT_TIMESTAMP
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM student_points sp
    WHERE sp.event_id = e.id
)
AND (
    e.status <> 'COMPLETED'
    OR e.registration_open = TRUE
    OR e.results_published = FALSE
);

-- A points row also proves that the student participated. Repair old
-- registration rows that were cancelled after points had already been issued.
UPDATE registrations r
SET status = 'REGISTERED'
WHERE r.status <> 'REGISTERED'
AND EXISTS (
    SELECT 1
    FROM student_points sp
    WHERE sp.event_id = r.event_id
      AND sp.student_id = r.student_id
);
