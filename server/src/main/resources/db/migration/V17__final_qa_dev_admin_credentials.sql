UPDATE users
SET active = false,
    updated_at = current_timestamp
WHERE email = 'admin@kongu.edu'
  AND role = 'SUPER_ADMIN';

INSERT INTO users (
    email,
    password_hash,
    role,
    student_id,
    faculty_id,
    first_login_required,
    active
)
VALUES (
    'keccodingforum@kongu.edu',
    '$2a$10$85NFUZakbsAInoLWlSA1euvH7fqvVmpQIKJckXDvBcmCFINIHYp32',
    'SUPER_ADMIN',
    NULL,
    NULL,
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    student_id = NULL,
    faculty_id = NULL,
    first_login_required = FALSE,
    active = TRUE,
    updated_at = current_timestamp;
