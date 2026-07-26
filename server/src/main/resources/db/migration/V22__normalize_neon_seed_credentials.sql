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
    4,
    'A',
    TRUE,
    TRUE
FROM departments d
WHERE d.code = 'CSE'
ON CONFLICT (register_number) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    year = EXCLUDED.year,
    section = EXCLUDED.section,
    placement_willing = EXCLUDED.placement_willing,
    active = TRUE;

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
    'Faculty User',
    'faculty@kongu.edu',
    d.id,
    TRUE,
    TRUE
FROM departments d
WHERE d.code = 'CSE'
ON CONFLICT (faculty_code) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    dept_monitoring_enabled = EXCLUDED.dept_monitoring_enabled,
    active = TRUE;

UPDATE users
SET active = FALSE,
    updated_at = current_timestamp
WHERE role = 'SUPER_ADMIN'
  AND email <> 'keccodingforum@kongu.edu';

INSERT INTO users (
    email,
    password_hash,
    role,
    student_id,
    faculty_id,
    first_login_required,
    active
)
VALUES
    (
        'keccodingforum@kongu.edu',
        '$2b$10$xpt/MZ94N/WgLx0Jbwzn.OjnPVBqQbvttjOBKaAOxdy1.Thgj5UGC',
        'SUPER_ADMIN',
        NULL,
        NULL,
        FALSE,
        TRUE
    ),
    (
        'student@kongu.edu',
        '$2b$10$aYTXfTWeNQGzvUFqx2.A8.d0g43qnJcwjqxNKZPoUsT5x38ZOv0xy',
        'STUDENT',
        (SELECT id FROM students WHERE register_number = '22CSR001'),
        NULL,
        FALSE,
        TRUE
    ),
    (
        'faculty@kongu.edu',
        '$2b$10$A8EGNkxQqX/em9LnrnIqu.Nf1witq1ubARSgToLy60uavlz36/W6S',
        'FACULTY',
        NULL,
        (SELECT id FROM faculties WHERE faculty_code = 'FAC001'),
        FALSE,
        TRUE
    )
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id,
    faculty_id = EXCLUDED.faculty_id,
    first_login_required = FALSE,
    active = TRUE,
    updated_at = current_timestamp;
