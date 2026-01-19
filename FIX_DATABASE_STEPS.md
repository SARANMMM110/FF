# Fix "Ignoring query to other database" Error

## The Problem
You're getting "Ignoring query to other database" because MySQL doesn't know which database to use.

## Solution: Select Database First

**Step 1: Connect to MySQL**
```bash
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff
```

**OR if that doesn't work, connect and then select database:**
```bash
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$'
```

**Step 2: Select the database (IMPORTANT - do this first!)**
```sql
USE frankimsocial_ff;
```

You should see: `Database changed`

**Step 3: Now add the columns**
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;
```

**Step 4: Verify**
```sql
DESCRIBE tasks;
```

Look for `repeat`, `repeat_detail`, `parent_recurring_task_id`, and `next_occurrence_date` in the output.

**Step 5: Exit and restart**
```sql
exit;
```
```bash
pm2 restart focusflow-backend
```

## Alternative: Run SQL File

**Upload and execute:**
```bash
# On your local machine
scp fix-repeat-column-complete.sql root@194.195.86.165:/var/www/focusflow/

# On server
ssh root@194.195.86.165
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff < /var/www/focusflow/fix-repeat-column-complete.sql
pm2 restart focusflow-backend
```

## Why This Happens

The "Ignoring query to other database" error occurs when:
- You're connected to MySQL but haven't selected a database
- The database name in the connection string doesn't match
- You need to explicitly run `USE database_name;` first

Always run `USE frankimsocial_ff;` before running ALTER TABLE commands!

