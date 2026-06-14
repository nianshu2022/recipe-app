CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);

ALTER TABLE fridge_items ADD COLUMN brand TEXT;
ALTER TABLE fridge_items ADD COLUMN image_url TEXT;
ALTER TABLE fridge_items ADD COLUMN nutriments TEXT;
