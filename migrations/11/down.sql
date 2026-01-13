
-- Remove the password update (this is just a safety rollback)
UPDATE admin_users 
SET password_hash = 'placeholder_hash'
WHERE username = 'master_admin';
