CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    endpoint_hash VARCHAR(64) NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent VARCHAR(500),
    device_name VARCHAR(255),
    platform VARCHAR(100),
    browser VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    permission_status VARCHAR(50) NOT NULL DEFAULT 'granted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP,
    last_success_at TIMESTAMP,
    failure_count INT NOT NULL DEFAULT 0,
    revoked_at TIMESTAMP
);

ALTER TABLE push_subscriptions
    ADD CONSTRAINT uk_push_subscriptions_endpoint_hash UNIQUE (endpoint_hash);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX idx_push_subscriptions_last_seen ON push_subscriptions(last_seen_at);
