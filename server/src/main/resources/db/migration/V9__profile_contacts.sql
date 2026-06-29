ALTER TABLE students
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30);

ALTER TABLE faculties
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30);
