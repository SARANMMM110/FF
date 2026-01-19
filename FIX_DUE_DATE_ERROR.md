# Fix "Incorrect datetime value: for column 'due_date'" Error

## The Problem

From the backend logs:
```
[Tasks] Values: [
  0,                                    // is_completed
  null,                                 // completed_at
  '2026-01-19T14:10:34.278Z',          // due_date ❌ NOT CONVERTED!
  '12',                                 // id
  'google-112044897924448800172'       // user_id
]
```

The `due_date` value `'2026-01-19T14:10:34.278Z'` is an ISO 8601 string, but MySQL expects `'2026-01-19 14:10:34'` format.

## The Fix

The date conversion function should convert this, but the server is running old compiled code. 

**Steps to fix:**

1. **Upload the fixed file:**
```bash
scp src/server/adapters/mysql.ts root@194.195.86.165:/var/www/FF/src/server/adapters/
```

2. **Rebuild and restart on server:**
```bash
ssh root@194.195.86.165
cd /var/www/FF
npm run build:server
pm2 restart focusflow-backend
```

3. **Verify the fix:**
```bash
pm2 logs focusflow-backend --lines 20
```

Try updating a task again - it should work now!

## What Was Fixed

- Added error handling in date conversion
- Added debug logging (in development mode)
- Ensured all ISO 8601 datetime strings are converted to MySQL format

The conversion function converts:
- `'2026-01-19T14:10:34.278Z'` → `'2026-01-19 14:10:34'`
- `'2026-01-19T12:36:56.984Z'` → `'2026-01-19 12:36:56'`

