DELETE FROM users WHERE email = 'superadmin@kongu.edu';

INSERT INTO students (
    register_number,
    name,
    email,
    department_id,
    year,
    section,
    placement_willing,
    active
)
SELECT
    '22CSR001',
    'Development Student',
    'student@kongu.edu',
    d.id,
    3,
    'A',
    TRUE,
    TRUE
FROM departments d
WHERE d.code = 'CSE'
ON CONFLICT (register_number) DO NOTHING;

INSERT INTO faculties (
    faculty_code,
    name,
    email,
    department_id,
    dept_monitoring_enabled,
    active
)
SELECT
    'FAC001',
    'Development Faculty',
    'faculty@kongu.edu',
    d.id,
    TRUE,
    TRUE
FROM departments d
WHERE d.code = 'CSE'
ON CONFLICT (faculty_code) DO NOTHING;

INSERT INTO users (email, password_hash, role, student_id, faculty_id, first_login_required, active)
VALUES
    ('admin@kongu.edu', '$2a$10$OzrJzA3JZrvPthaWXlnC3.llnmmZU/RouC8Jaok6E0CZD1dIlHk1i', 'SUPER_ADMIN', NULL, NULL, TRUE, TRUE),
    ('student@kongu.edu', '$2a$10$cBDVLURWQXkHzqD6uXUegusMSlU5lznIE6k7MHyC8kjpDWZGalNEG', 'STUDENT', (SELECT id FROM students WHERE email = 'student@kongu.edu'), NULL, TRUE, TRUE),
    ('faculty@kongu.edu', '$2a$10$zsRb3D814p2j7nl1znkzBuS7PQo4PTDE2nD3aC6ya2uYTgpjoD5Xe', 'FACULTY', NULL, (SELECT id FROM faculties WHERE email = 'faculty@kongu.edu'), TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id,
    faculty_id = EXCLUDED.faculty_id,
    first_login_required = EXCLUDED.first_login_required,
    active = EXCLUDED.active,
    updated_at = CURRENT_TIMESTAMP;

