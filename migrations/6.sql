
ALTER TABLE user_settings ADD COLUMN minimal_mode_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN blocked_websites TEXT;
ALTER TABLE user_settings ADD COLUMN show_motivational_prompts BOOLEAN DEFAULT 1;
