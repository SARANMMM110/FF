# Check Backend Logs for Update Error

## Step 1: Check PM2 Logs

**SSH to your server and check the logs:**
```bash
ssh root@194.195.86.165
pm2 logs focusflow-backend --lines 50
```

**Look for lines like:**
```
[Tasks] Error updating task: ...
[Tasks] SQL: UPDATE tasks SET ...
[Tasks] Values: [...]
```

This will show you the actual SQL error.

## Step 2: Verify Fixed Code is Deployed

**Check if the date conversion fix is in the code:**
```bash
grep -A 5 "bind(...values: unknown\[\])" /var/www/FF/src/server/adapters/mysql.ts
```

**Should show:**
```typescript
bind(...values: unknown[]): D1PreparedStatement {
  // Convert dates in the new values before adding them
  const convertedNewValues = convertDatesForMySQL(values);
  return new BoundMysqlD1PreparedStatement(
```

**If it doesn't show the conversion, upload the fixed file:**
```bash
# From your local machine
scp src/server/adapters/mysql.ts root@194.195.86.165:/var/www/FF/src/server/adapters/
```

**Then rebuild and restart:**
```bash
ssh root@194.195.86.165
cd /var/www/FF
npm run build:server
pm2 restart focusflow-backend
```

## Step 3: Try Again

After deploying the fix, try updating a task again and check the logs if it still fails.

## Common Issues:

1. **Date format error**: "Incorrect datetime value" - means date conversion isn't working
2. **Column not found**: "Unknown column" - means column doesn't exist in database
3. **SQL syntax error**: Check the SQL query in the logs

