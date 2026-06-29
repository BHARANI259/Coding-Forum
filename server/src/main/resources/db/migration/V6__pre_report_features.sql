CREATE TABLE event_problem_statements (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_link TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_rounds (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_name VARCHAR(255) NOT NULL,
    round_order INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    description TEXT,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_rounds_status CHECK (status IN ('NOT_STARTED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ux_event_round_order UNIQUE (event_id, round_order)
);

CREATE TABLE event_allowed_technical_areas (
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    technical_area VARCHAR(30) NOT NULL,
    CONSTRAINT chk_event_allowed_technical_area CHECK (technical_area IN ('SOFTWARE', 'HARDWARE')),
    PRIMARY KEY (event_id, technical_area)
);

ALTER TABLE students
    ADD COLUMN technical_area VARCHAR(30) NOT NULL DEFAULT 'SOFTWARE',
    ADD CONSTRAINT chk_students_technical_area CHECK (technical_area IN ('SOFTWARE', 'HARDWARE'));

ALTER TABLE registrations
    ADD COLUMN problem_statement_id BIGINT REFERENCES event_problem_statements(id);

ALTER TABLE teams
    ADD COLUMN problem_statement_id BIGINT REFERENCES event_problem_statements(id);

ALTER TABLE events
    ADD COLUMN results_published BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN results_published_at TIMESTAMP;

CREATE INDEX idx_event_problem_statements_event_id ON event_problem_statements(event_id);
CREATE INDEX idx_event_rounds_event_id ON event_rounds(event_id);
CREATE INDEX idx_registrations_problem_statement_id ON registrations(problem_statement_id);
CREATE INDEX idx_teams_problem_statement_id ON teams(problem_statement_id);
CREATE INDEX idx_students_technical_area ON students(technical_area);
CREATE INDEX idx_events_results_published ON events(results_published);
