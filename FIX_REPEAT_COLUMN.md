# Fix "Unknown column 'repeat'" Error

## The Problem
The `repeat` column doesn't exist in your MySQL database. You tried to add it but the escaping was wrong.

## Solution: Run SQL Directly in MySQL Client

**Step 1: Connect to MySQL**
```bash
ssh root@194.195.86.165
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff
```

**Step 2: Run these SQL commands (copy and paste each line one at a time)**
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;
```

**Step 3: Verify columns were added**
```sql
DESCRIBE tasks;
```

You should see `repeat`, `repeat_detail`, `parent_recurring_task_id`, and `next_occurrence_date` in the output.

**Step 4: Exit MySQL and restart backend**
```sql
exit;
```
```bash
pm2 restart focusflow-backend
```

## Alternative: Use a SQL File

**Option 1: Upload and run SQL file**
```bash
# On your local machine
scp fix-repeat-column-direct.sql root@194.195.86.165:/var/www/focusflow/

# On server
ssh root@194.195.86.165
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff < /var/www/focusflow/fix-repeat-column-direct.sql
pm2 restart focusflow-backend
```

**Option 2: Run migration script (handles all migrations)**
```bash
ssh root@194.195.86.165 "cd /var/www/focusflow && npm run migrate && pm2 restart focusflow-backend"
```

## Important Notes

- **In MySQL client**: Use backticks directly: `` `repeat` ``
- **In shell script**: Escape backticks: `` \`repeat\` ``
- **In SQL file**: Use backticks directly: `` `repeat` ``

The error you saw (`Unknown command '\`'`) happened because the MySQL client interpreted the escaped backtick as a command. When typing directly in MySQL, just use plain backticks.

