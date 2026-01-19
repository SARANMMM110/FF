# Fix Task Creation Error

## The Problem
1. **Database**: The `repeat` column doesn't exist in the tasks table
2. **Code**: Server is using old compiled code without backticks

## Solution

### Step 1: Add Missing Column to Database

**SSH to server and run:**

```bash
ssh root@194.195.86.165
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff <<EOF
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \`repeat\` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;
EOF
```

**Or use the script:**
```bash
scp fix-repeat-column.sh root@194.195.86.165:/var/www/focusflow/
ssh root@194.195.86.165 "cd /var/www/focusflow && chmod +x fix-repeat-column.sh && ./fix-repeat-column.sh"
```

### Step 2: Upload Fixed Code

**Upload the fixed source files:**
```bash
scp src/worker/index.ts root@194.195.86.165:/var/www/focusflow/src/worker/
scp src/worker/recurring-tasks.ts root@194.195.86.165:/var/www/focusflow/src/worker/
```

### Step 3: Restart Backend

**If using tsx (TypeScript directly):**
```bash
ssh root@194.195.86.165 "cd /var/www/focusflow && pm2 restart focusflow-backend"
```

**If using compiled JavaScript:**
```bash
# Rebuild on server
ssh root@194.195.86.165 "cd /var/www/focusflow && npm run build:server && pm2 restart focusflow-backend"
```

### Step 4: Verify

**Check logs:**
```bash
ssh root@194.195.86.165 "pm2 logs focusflow-backend --lines 20"
```

**Test creating a task** - should work now!



