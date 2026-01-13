
ALTER TABLE user_settings ADD COLUMN custom_theme_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN custom_theme_primary TEXT;
ALTER TABLE user_settings ADD COLUMN custom_theme_secondary TEXT;
ALTER TABLE user_settings ADD COLUMN custom_theme_accent TEXT;
