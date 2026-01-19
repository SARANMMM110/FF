# Fix Remaining Columns

## Status
✅ `repeat` column added successfully!

## Next Steps

**Check what columns already exist:**
```sql
DESCRIBE tasks;
```

Look for:
- `repeat` (should exist now)
- `repeat_detail` (check if it exists)
- `parent_recurring_task_id` (check if it exists)
- `next_occurrence_date` (check if it exists)

**Add missing columns (use underscore, not space!):**

If `repeat_detail` doesn't exist:
```sql
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
```

If `parent_recurring_task_id` doesn't exist:
```sql
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
```

If `next_occurrence_date` doesn't exist:
```sql
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;
```

**Important:** Use `repeat_detail` (with underscore), NOT `repeat detail` (with space)!

**After adding all columns:**
```sql
DESCRIBE tasks;
```

**Then exit and restart:**
```sql
exit;
```
```bash
pm2 restart focusflow-backend
```

