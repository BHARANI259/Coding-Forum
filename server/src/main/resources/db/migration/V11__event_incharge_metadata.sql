ALTER TABLE event_incharges
    ADD COLUMN IF NOT EXISTS id BIGSERIAL;

ALTER TABLE event_incharges
    ADD COLUMN IF NOT EXISTS primary_incharge BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE event_incharges
    ADD COLUMN IF NOT EXISTS responsibility VARCHAR(255);

ALTER TABLE event_incharges
    ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id);

ALTER TABLE event_incharges
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_event_incharges_id ON event_incharges(id);
CREATE INDEX IF NOT EXISTS idx_event_incharges_event_id ON event_incharges(event_id);
CREATE INDEX IF NOT EXISTS idx_event_incharges_faculty_id ON event_incharges(faculty_id);
CREATE INDEX IF NOT EXISTS idx_event_incharges_primary ON event_incharges(primary_incharge);
