ALTER TABLE events
    ADD COLUMN IF NOT EXISTS poster_image_data BYTEA;
