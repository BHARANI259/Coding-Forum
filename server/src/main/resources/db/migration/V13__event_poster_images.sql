ALTER TABLE events
    ADD COLUMN IF NOT EXISTS poster_image_url TEXT,
    ADD COLUMN IF NOT EXISTS poster_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS poster_content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS poster_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS poster_uploaded_at TIMESTAMP;
