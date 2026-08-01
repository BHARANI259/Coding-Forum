ALTER TABLE event_categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS winner_points INT NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS runner_up_points INT NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS second_runner_up_points INT NOT NULL DEFAULT 40,
    ADD COLUMN IF NOT EXISTS participant_points INT NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS disqualified_points INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS not_presented_points INT NOT NULL DEFAULT 0;

UPDATE event_categories
SET category_type = CASE
        WHEN lower(name) LIKE '%contest%' OR lower(name) LIKE '%coding%' OR lower(name) LIKE '%placement%' OR lower(name) LIKE '%drill%' THEN 'CONTEST'
        WHEN lower(name) LIKE '%paper%' OR lower(name) LIKE '%project%' OR lower(name) LIKE '%presentation%' THEN 'DOMAIN'
        ELSE category_type
    END,
    winner_points = ROUND(COALESCE(weightage, 1) * 100)::INT,
    runner_up_points = ROUND(COALESCE(weightage, 1) * 60)::INT,
    second_runner_up_points = ROUND(COALESCE(weightage, 1) * 40)::INT,
    participant_points = ROUND(COALESCE(weightage, 1) * 10)::INT
WHERE winner_points = 100
  AND runner_up_points = 60
  AND second_runner_up_points = 40
  AND participant_points = 10;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS mandatory_event BOOLEAN NOT NULL DEFAULT false;
