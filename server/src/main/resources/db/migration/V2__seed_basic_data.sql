INSERT INTO departments (code, name) VALUES
    ('CSE', 'Computer Science and Engineering'),
    ('IT', 'Information Technology'),
    ('ECE', 'Electronics and Communication Engineering'),
    ('EEE', 'Electrical and Electronics Engineering'),
    ('MECH', 'Mechanical Engineering'),
    ('CIVIL', 'Civil Engineering'),
    ('AIDS', 'Artificial Intelligence and Data Science');

INSERT INTO event_categories (name, weightage) VALUES
    ('Hackathon', 1.00),
    ('Coding Contest', 1.00),
    ('Project Presentation', 1.00),
    ('Paper Presentation', 1.00),
    ('Placement Drill', 1.00);

INSERT INTO users (email, password_hash, role, first_login_required, active) VALUES
    ('superadmin@kongu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SUPER_ADMIN', TRUE, TRUE);

