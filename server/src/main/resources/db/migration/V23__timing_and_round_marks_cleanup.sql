ALTER TABLE event_round_results
    ADD COLUMN IF NOT EXISTS marks NUMERIC(10, 2);

ALTER TABLE event_round_results
    DROP CONSTRAINT IF EXISTS chk_event_round_results_status;

ALTER TABLE event_round_results
    ADD CONSTRAINT chk_event_round_results_status
    CHECK (status IN ('SELECTED', 'QUALIFIED', 'WINNER', 'RUNNER_UP', 'SECOND_RUNNER_UP', 'PARTICIPANT', 'DISQUALIFIED', 'NOT_PRESENTED'));

CREATE INDEX IF NOT EXISTS idx_event_round_results_round_status ON event_round_results(round_id, status);
