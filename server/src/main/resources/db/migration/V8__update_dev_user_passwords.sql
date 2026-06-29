UPDATE users
SET password_hash = '$2a$10$YOYdr9c4a61HQxKs2hLyfuuzRja36sJc5oTtaKldawMm60bOW7OMa',
    first_login_required = false,
    updated_at = current_timestamp
WHERE email = 'student@kongu.edu';

UPDATE users
SET password_hash = '$2a$10$FAnfIQN9wgX2Cty/dsXCj.lWBOX.JpuMSUdAevaid5iXE4fnb7eJe',
    first_login_required = false,
    updated_at = current_timestamp
WHERE email = 'faculty@kongu.edu';
