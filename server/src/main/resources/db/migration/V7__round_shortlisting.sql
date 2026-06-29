ALTER TABLE event_rounds
    ADD COLUMN final_round BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE event_round_results (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id BIGINT NOT NULL REFERENCES event_rounds(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id),
    student_id BIGINT REFERENCES students(id),
    status VARCHAR(40) NOT NULL,
    declared_by BIGINT REFERENCES users(id),
    declared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_round_results_status CHECK (status IN ('SELECTED', 'WINNER', 'RUNNER_UP', 'PARTICIPANT', 'DISQUALIFIED')),
    CONSTRAINT chk_event_round_results_target CHECK (
        (team_id IS NOT NULL AND student_id IS NULL) OR
        (team_id IS NULL AND student_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX ux_event_round_results_team ON event_round_results(round_id, team_id) WHERE team_id IS NOT NULL;
CREATE UNIQUE INDEX ux_event_round_results_student ON event_round_results(round_id, student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_event_round_results_event_id ON event_round_results(event_id);
CREATE INDEX idx_event_round_results_round_id ON event_round_results(round_id);
