
-- Insert demo focus sessions for analytics
INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, session_type, timer_mode, notes, created_at, updated_at) VALUES
('demo_user_001', (SELECT id FROM tasks WHERE title = 'Launch Q4 Social Media Campaign' AND user_id = 'demo_user_001'), '2025-10-22 09:00:00', '2025-10-22 09:25:00', 25, 'focus', 'pomodoro', 'Researched competitor campaigns and trends', '2025-10-22 09:00:00', '2025-10-22 09:25:00'),
('demo_user_001', (SELECT id FROM tasks WHERE title = 'Database Backup Automation' AND user_id = 'demo_user_001'), '2025-10-22 10:30:00', '2025-10-22 11:00:00', 30, 'focus', 'custom', 'Set up initial backup scripts and tested functionality', '2025-10-22 10:30:00', '2025-10-22 11:00:00'),
('demo_user_001', (SELECT id FROM tasks WHERE title = 'Email Newsletter Design' AND user_id = 'demo_user_001'), '2025-10-21 14:00:00', '2025-10-21 14:50:00', 50, 'focus', 'classic', 'Completed responsive template design and mobile optimization', '2025-10-21 14:00:00', '2025-10-21 14:50:00');

-- Insert additional sessions for the past week to show analytics trends
INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, session_type, timer_mode, created_at, updated_at) VALUES
('demo_user_001', (SELECT id FROM tasks WHERE title = 'Launch Q4 Social Media Campaign' AND user_id = 'demo_user_001'), '2025-10-21 09:15:00', '2025-10-21 09:40:00', 25, 'focus', 'pomodoro', '2025-10-21 09:15:00', '2025-10-21 09:40:00'),
('demo_user_001', (SELECT id FROM tasks WHERE title = 'Team Onboarding Process' AND user_id = 'demo_user_001'), '2025-10-20 13:00:00', '2025-10-20 13:45:00', 45, 'focus', 'custom', '2025-10-20 13:00:00', '2025-10-20 13:45:00'),
('demo_user_001', NULL, '2025-10-19 16:00:00', '2025-10-19 16:25:00', 25, 'focus', 'pomodoro', '2025-10-19 16:00:00', '2025-10-19 16:25:00');
