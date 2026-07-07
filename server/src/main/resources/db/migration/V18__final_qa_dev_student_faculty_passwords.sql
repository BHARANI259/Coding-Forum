UPDATE users
SET password_hash = '$2a$10$wit3C0dxU8Oj84KRIGzh/ensNgfPyEWNMspDimyvzjWyJYiuVg0mi',
    first_login_required = false,
    active = true,
    updated_at = current_timestamp
WHERE email = 'student@kongu.edu'
  AND role = 'STUDENT';

UPDATE users
SET password_hash = '$2a$10$DH6Gmgk85Sqd1vdA6pfgPeiUz8rGciG7qgrTxNOuWOyDb9BLVD0TG',
    first_login_required = false,
    active = true,
    updated_at = current_timestamp
WHERE email = 'faculty@kongu.edu'
  AND role = 'FACULTY';
