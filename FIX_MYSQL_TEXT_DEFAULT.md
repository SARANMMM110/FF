# Fix MySQL TEXT DEFAULT Error

## The Problem
MySQL doesn't allow `DEFAULT` values for `TEXT`, `BLOB`, `GEOMETRY`, or `JSON` columns.

## Solution: Remove DEFAULT Clause

**Run these commands:**

```sql
USE frankimsocial_ff;
```

```sql
ALTER TABLE tasks ADD COLUMN `repeat` TEXT;
```

```sql
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
```

```sql
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
```

```sql
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;
```

**Verify:**
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

## Why This Happens

MySQL has restrictions on DEFAULT values:
- ✅ `VARCHAR` can have DEFAULT
- ❌ `TEXT` cannot have DEFAULT
- ❌ `BLOB` cannot have DEFAULT

Your application code should handle setting default values (like `'none'`) when inserting rows, not the database.

## Application Code Note

The application code in `src/worker/index.ts` should already handle setting `repeat` to `'none'` when creating tasks. The database column just needs to exist without a default value.

