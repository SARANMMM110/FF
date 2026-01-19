
-- Update the master admin user with proper password hash for "admin123"
UPDATE admin_users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'master_admin';

-- If the user doesn't exist, create it (MySQL syntax)
INSERT IGNORE INTO admin_users (username, password_hash, email, is_super_admin) 
VALUES ('master_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@focusflow.com', 1);
