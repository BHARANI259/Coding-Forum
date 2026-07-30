ALTER TABLE event_media
    ADD COLUMN IF NOT EXISTS media_data BYTEA;
