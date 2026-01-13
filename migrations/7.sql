
ALTER TABLE user_settings ADD COLUMN notion_sync_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN notion_database_id TEXT;
