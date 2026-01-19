# Fix Admin Panel Login and Data Display

## Issues Found

1. **Admin Middleware Using SQLite Syntax**: The middleware was using `datetime('now')` which is SQLite syntax, not MySQL. This would cause all admin API calls to fail with authentication errors.

2. **Active Users Query Using JavaScript Date**: The stats endpoint was calculating dates in JavaScript and binding them, which could cause issues with MySQL date comparisons.

## Fixes Applied

### 1. Fixed Admin Middleware (Line 417)
**Before:**
```sql
WHERE ads.session_token = ? AND ads.expires_at > datetime('now')
```

**After:**
```sql
WHERE ads.session_token = ? AND ads.expires_at > NOW()
```

### 2. Fixed Active Users Query (Line 997-999)
**Before:**
```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const { results: activeUsers } = await c.env.DB.prepare(
  "SELECT COUNT(DISTINCT user_id) as count FROM users WHERE last_login_at >= ?"
).bind(sevenDaysAgo).all();
```

**After:**
```typescript
const { results: activeUsers } = await c.env.DB.prepare(
  "SELECT COUNT(DISTINCT user_id) as count FROM users WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
).all();
```

## Deployment Steps

1. **Upload the fixed file:**
```bash
scp src/worker/index.ts root@194.195.86.165:/var/www/FF/src/worker/
```

2. **Rebuild and restart on server:**
```bash
ssh root@194.195.86.165
cd /var/www/FF
npm run build:server
pm2 restart focusflow-backend
```

3. **Verify admin user exists:**
```bash
mysql -u your_user -p your_database -e "SELECT * FROM admin_users WHERE username = 'master_admin';"
```

If the admin user doesn't exist, create it:
```sql
INSERT INTO admin_users (username, password_hash, email, is_super_admin) 
VALUES ('master_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@focusflow.com', 1);
```

4. **Test the admin panel:**
- Go to `/admin/login`
- Use credentials: `master_admin` / `admin123`
- After login, the dashboard should now load data correctly

## What Was Wrong

The admin middleware was failing to validate sessions because it was using SQLite syntax (`datetime('now')`) instead of MySQL syntax (`NOW()`). This meant:
- Login would succeed (session created)
- But all subsequent API calls would fail with "Invalid or expired admin session"
- No data would load in the dashboard

Now the middleware correctly validates sessions using MySQL syntax, and the dashboard should display all statistics and user data.

