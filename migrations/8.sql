
-- Insert demo tasks across Marketing and Ops projects
INSERT INTO tasks (user_id, title, description, status, priority, estimated_minutes, project, tags, created_at, updated_at) VALUES
('demo_user_001', 'Launch Q4 Social Media Campaign', 'Plan and execute social media strategy for the holiday season including content calendar, influencer partnerships, and paid ad campaigns', 'in_progress', 3, 120, 'Marketing', '["social-media", "campaigns", "q4"]', '2025-10-20 09:00:00', '2025-10-20 09:00:00'),
('demo_user_001', 'Website Analytics Review', 'Analyze website traffic patterns, user behavior, and conversion metrics from the past quarter to optimize user experience', 'todo', 2, 60, 'Marketing', '["analytics", "optimization", "quarterly"]', '2025-10-21 10:30:00', '2025-10-21 10:30:00'),
('demo_user_001', 'Email Newsletter Design', 'Create responsive email templates for weekly newsletter with A/B testing variants for subject lines and CTA buttons', 'completed', 1, 90, 'Marketing', '["email", "design", "templates"]', '2025-10-19 14:15:00', '2025-10-22 16:45:00'),
('demo_user_001', 'Server Infrastructure Audit', 'Comprehensive review of cloud infrastructure, security protocols, and performance monitoring to ensure optimal uptime', 'todo', 3, 180, 'Ops', '["infrastructure", "security", "audit"]', '2025-10-22 08:00:00', '2025-10-22 08:00:00'),
('demo_user_001', 'Database Backup Automation', 'Implement automated daily backup system with failover procedures and disaster recovery testing protocols', 'in_progress', 2, 150, 'Ops', '["database", "backup", "automation"]', '2025-10-21 11:00:00', '2025-10-21 11:00:00'),
('demo_user_001', 'Team Onboarding Process', 'Standardize new employee onboarding workflow including documentation, access provisioning, and training schedules', 'completed', 1, 75, 'Ops', '["hr", "onboarding", "process"]', '2025-10-18 13:20:00', '2025-10-20 15:30:00');

-- Update completed tasks with completion timestamps and mark as completed
UPDATE tasks SET is_completed = 1, completed_at = '2025-10-22 16:45:00', actual_minutes = 85 WHERE title = 'Email Newsletter Design';
UPDATE tasks SET is_completed = 1, completed_at = '2025-10-20 15:30:00', actual_minutes = 90 WHERE title = 'Team Onboarding Process';
