CREATE INDEX IF NOT EXISTS idx_registrations_event_team_id ON registrations(event_id, team_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_leader_student_id ON teams(event_id, leader_student_id);
