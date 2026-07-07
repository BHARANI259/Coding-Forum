UPDATE students
SET email = 'student@kongu.edu'
WHERE register_number = '22CSR001';

UPDATE users
SET email = 'student@kongu.edu',
    password_hash = '$2a$10$wit3C0dxU8Oj84KRIGzh/ensNgfPyEWNMspDimyvzjWyJYiuVg0mi',
    first_login_required = false,
    active = true,
    updated_at = current_timestamp
WHERE student_id = (SELECT id FROM students WHERE register_number = '22CSR001')
  AND role = 'STUDENT';
