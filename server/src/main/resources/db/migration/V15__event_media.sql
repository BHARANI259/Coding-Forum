CREATE TABLE IF NOT EXISTS event_media (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    media_type VARCHAR(50) NOT NULL DEFAULT 'PHOTO',
    caption VARCHAR(500),
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by_user_id BIGINT REFERENCES users(id),
    CONSTRAINT chk_event_media_type CHECK (media_type IN ('PHOTO', 'GEOTAG_SCREENSHOT', 'PARTICIPANT_GROUP', 'WINNER_PHOTO', 'EVENT_PROOF', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_uploaded_by ON event_media(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_event_media_type ON event_media(media_type);
CREATE INDEX IF NOT EXISTS idx_event_media_deleted ON event_media(deleted);
