CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

CREATE INDEX IF NOT EXISTS idx_students_department_year_section ON students(department_id, year, section);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);

CREATE INDEX IF NOT EXISTS idx_faculties_active ON faculties(active);
CREATE INDEX IF NOT EXISTS idx_faculties_department_active ON faculties(department_id, active);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_registration_open ON events(registration_open);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_status_start_datetime ON events(status, start_datetime);

CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_student_status ON registrations(student_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON registrations(registered_at);

CREATE INDEX IF NOT EXISTS idx_results_event_id ON results(event_id);
CREATE INDEX IF NOT EXISTS idx_results_declared_at ON results(declared_at);
CREATE INDEX IF NOT EXISTS idx_results_result_type ON results(result_type);

CREATE INDEX IF NOT EXISTS idx_student_points_created_at ON student_points(created_at);
CREATE INDEX IF NOT EXISTS idx_student_points_point_type ON student_points(point_type);

CREATE INDEX IF NOT EXISTS idx_event_rounds_event_status ON event_rounds(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_problem_statements_event_active ON event_problem_statements(event_id, active);
CREATE INDEX IF NOT EXISTS idx_event_media_event_deleted_uploaded ON event_media(event_id, deleted, uploaded_at);
