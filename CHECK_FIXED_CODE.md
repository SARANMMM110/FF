# How to Check if Fixed Code is on Server

## Run this command:
```bash
grep -n "`repeat`" /var/www/FF/src/worker/index.ts
```

## What to Look For:

### ✅ **GOOD - Fixed code is there:**
You should see output like:
```
1479:      `INSERT INTO tasks (user_id, title, description, priority, estimated_minutes, project, due_date, tags, status, \`repeat\`, repeat_detail, next_occurrence_date)
1617:    updates.push("`repeat` = ?");
```

**This means:** The code has backticks around `repeat` - it's fixed! ✅

### ❌ **BAD - Code is NOT fixed:**
You might see:
- No output (empty)
- OR lines with `repeat` without backticks like:
```
1479:      `INSERT INTO tasks (..., repeat, ...)
```

**This means:** The code doesn't have backticks - you need to upload the fixed files! ❌

## Also Check recurring-tasks.ts:
```bash
grep -n "`repeat`" /var/www/FF/src/worker/recurring-tasks.ts
```

Should show lines with backticks around `repeat`.

## If Code is NOT Fixed:

Upload the fixed files from your local machine:

```bash
# From Windows PowerShell (your local machine)
scp src/worker/index.ts root@194.195.86.165:/var/www/FF/src/worker/
scp src/worker/recurring-tasks.ts root@194.195.86.165:/var/www/FF/src/worker/
```

Then rebuild and restart:
```bash
ssh root@194.195.86.165
cd /var/www/FF
npm run build:server
pm2 restart focusflow-backend
```

