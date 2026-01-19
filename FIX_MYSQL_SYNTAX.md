# Fix MySQL Syntax Error

## The Problem
MySQL's `ALTER TABLE` doesn't support `IF NOT EXISTS` clause. That's a PostgreSQL feature.

## Solution: Remove IF NOT EXISTS

**Step 1: You're already connected, so just run:**
```sql
USE frankimsocial_ff;
```

**Step 2: Add columns (without IF NOT EXISTS)**
```sql
ALTER TABLE tasks ADD COLUMN `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;
```

**Note:** If a column already exists, MySQL will give an error like "Duplicate column name 'repeat'". That's fine - just means the column is already there. Skip that command and continue with the next one.

**Step 3: Verify**
```sql
DESCRIBE tasks;
```

**Step 4: Exit and restart**
```sql
exit;
```
```bash
pm2 restart focusflow-backend
```

## Alternative: Check First, Then Add

If you want to be safe, check which columns exist first:

```sql
DESCRIBE tasks;
```

Then only add the columns that are missing. If you see `repeat` in the output, skip that ALTER TABLE command.

