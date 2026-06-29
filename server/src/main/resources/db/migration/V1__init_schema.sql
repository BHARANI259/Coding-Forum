CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    register_number VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    year INT NOT NULL,
    section VARCHAR(20),
    placement_willing BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculties (
    id BIGSERIAL PRIMARY KEY,
    faculty_code VARCHAR(40) UNIQUE,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    dept_monitoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    student_id BIGINT,
    faculty_id BIGINT,
    first_login_required BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'FACULTY', 'SUPER_ADMIN')),
    CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_users_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

CREATE TABLE event_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    weightage NUMERIC(8,2) NOT NULL DEFAULT 1.00,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES event_categories(id),
    event_type VARCHAR(30) NOT NULL,
    venue VARCHAR(180),
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    registration_open BOOLEAN NOT NULL DEFAULT FALSE,
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    min_team_size INT,
    max_team_size INT,
    max_participants INT,
    max_teams INT,
    placement_willing_only BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_events_type CHECK (event_type IN ('TEAM', 'INDIVIDUAL')),
    CONSTRAINT chk_events_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE event_allowed_departments (
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id),
    PRIMARY KEY (event_id, department_id)
);

CREATE TABLE event_allowed_years (
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    year INT NOT NULL,
    PRIMARY KEY (event_id, year)
);

CREATE TABLE event_allowed_sections (
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    section VARCHAR(20) NOT NULL,
    PRIMARY KEY (event_id, section)
);

CREATE TABLE event_incharges (
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    faculty_id BIGINT REFERENCES faculties(id),
    PRIMARY KEY (event_id, faculty_id)
);

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    team_name VARCHAR(160) NOT NULL,
    team_code VARCHAR(30) UNIQUE NOT NULL,
    leader_student_id BIGINT REFERENCES students(id),
    locked_after_registration BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, student_id)
);

CREATE TABLE registrations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    student_id BIGINT REFERENCES students(id),
    team_id BIGINT REFERENCES teams(id),
    registration_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, student_id),
    CONSTRAINT chk_registrations_type CHECK (registration_type IN ('INDIVIDUAL', 'TEAM')),
    CONSTRAINT chk_registrations_status CHECK (status IN ('REGISTERED', 'CANCELLED', 'DISQUALIFIED'))
);

CREATE TABLE results (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    team_id BIGINT REFERENCES teams(id),
    student_id BIGINT REFERENCES students(id),
    result_type VARCHAR(40) NOT NULL,
    points_awarded INT NOT NULL DEFAULT 0,
    declared_by BIGINT REFERENCES users(id),
    declared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_results_type CHECK (result_type IN ('WINNER', 'RUNNER_UP', 'SECOND_RUNNER_UP', 'PARTICIPANT', 'DISQUALIFIED'))
);

CREATE UNIQUE INDEX ux_results_event_team_present ON results(event_id, team_id) WHERE team_id IS NOT NULL;
CREATE UNIQUE INDEX ux_results_event_student_present ON results(event_id, student_id) WHERE student_id IS NOT NULL;

CREATE TABLE student_points (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    event_id BIGINT REFERENCES events(id),
    category_id BIGINT REFERENCES event_categories(id),
    department_id BIGINT REFERENCES departments(id),
    points INT NOT NULL,
    point_type VARCHAR(40) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_student_points_type CHECK (point_type IN ('WINNER', 'RUNNER_UP', 'SECOND_RUNNER_UP', 'PARTICIPATION', 'PENALTY', 'MANUAL'))
);

CREATE INDEX idx_students_department_id ON students(department_id);
CREATE INDEX idx_faculties_department_id ON faculties(department_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_student_id ON registrations(student_id);
CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_team_members_student_id ON team_members(student_id);
CREATE INDEX idx_student_points_student_id ON student_points(student_id);
CREATE INDEX idx_student_points_department_id ON student_points(department_id);
CREATE INDEX idx_student_points_category_id ON student_points(category_id);

