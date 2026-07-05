UPDATE event_problem_statements
SET description = ''
WHERE description IS NULL;

ALTER TABLE event_problem_statements
    ALTER COLUMN description SET NOT NULL;

CREATE TABLE IF NOT EXISTS event_problem_statement_links (
    id BIGSERIAL PRIMARY KEY,
    problem_statement_id BIGINT NOT NULL REFERENCES event_problem_statements(id) ON DELETE CASCADE,
    label VARCHAR(255),
    url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO event_problem_statement_links (problem_statement_id, label, url, display_order)
SELECT eps.id, 'Reference Link', eps.reference_link, 1
FROM event_problem_statements eps
WHERE eps.reference_link IS NOT NULL
  AND TRIM(eps.reference_link) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM event_problem_statement_links link
      WHERE link.problem_statement_id = eps.id
        AND link.url = eps.reference_link
  );

CREATE INDEX IF NOT EXISTS idx_event_problem_statements_active ON event_problem_statements(active);
CREATE INDEX IF NOT EXISTS idx_event_problem_statement_links_problem_id ON event_problem_statement_links(problem_statement_id);
