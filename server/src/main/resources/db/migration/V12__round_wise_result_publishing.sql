ALTER TABLE event_rounds
    ADD COLUMN IF NOT EXISTS result_published BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE event_rounds
    ADD COLUMN IF NOT EXISTS result_published_at TIMESTAMP;

ALTER TABLE event_rounds
    ADD COLUMN IF NOT EXISTS published_by BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_event_rounds_event_published ON event_rounds(event_id, result_published);

ALTER TABLE event_round_results
    DROP CONSTRAINT IF EXISTS chk_event_round_results_status;

ALTER TABLE event_round_results
    ADD CONSTRAINT chk_event_round_results_status
    CHECK (status IN ('SELECTED', 'QUALIFIED', 'WINNER', 'RUNNER_UP', 'SECOND_RUNNER_UP', 'PARTICIPANT', 'DISQUALIFIED'));
