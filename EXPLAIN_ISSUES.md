# Explanation of Two Issues

## Issue 1: PATCH Request Returns 500 Error

**What's happening:**
- When you try to update a task (mark as complete, drag to different column), the frontend sends a `PATCH /api/tasks/12` request
- The backend returns `500 Internal Server Error`
- The update fails on the server

**Why it's failing:**
The backend logs should show the actual error. Common causes:
1. **Date conversion issue**: `due_date` or `completed_at` values not being converted from ISO format to MySQL format
2. **Missing column**: A column referenced in the UPDATE query doesn't exist
3. **SQL syntax error**: Reserved keywords not escaped properly

**How to check:**
```bash
ssh root@194.195.86.165
pm2 logs focusflow-backend --lines 50
```

Look for lines like:
```
[Tasks] Error updating task: ...
[Tasks] SQL: UPDATE tasks SET ...
[Tasks] Values: [...]
```

## Issue 2: "Mark as Complete" Only Works After Reload

**What's happening:**
1. You click "Mark as Complete" → UI updates immediately (optimistic update)
2. API call fails in background (500 error)
3. UI shows task as complete (but server still has it as incomplete)
4. You reload page → Fetches from server → Shows actual state (incomplete)
5. You click again → This time it works → Server updates → Reload shows it complete

**Why this happens:**

### The Code Flow:

**In `TaskBoard.tsx` (lines 87-111):**
```typescript
// OPTIMISTIC UPDATE: Update UI immediately
const updatedTask = { ...task, ...updates, _optimistic: true };
const newOptimisticTasks = tasks.map(t => 
  t.id === draggedTaskId ? updatedTask : t
);
setOptimisticTasks(newOptimisticTasks);
console.log("⚡ Optimistic update applied");

// Now sync with API in background
try {
  await onUpdate(draggedTaskId, updates);
  console.log("✅ API sync successful");
} catch (error) {
  console.error("❌ API sync failed:", error);
  // ❌ PROBLEM: Doesn't revert the optimistic update!
}
```

**The Problem:**
- The code does an **optimistic update** (updates UI immediately)
- Then tries to sync with the API
- **BUT** when the API fails, it doesn't revert the optimistic update
- So the UI shows the task as complete, but the server doesn't have it
- On reload, it fetches the real state from the server

**The Fix Needed:**
1. **Fix the backend** (Issue 1) - so API calls succeed
2. **Add error handling** - revert optimistic updates when API fails
3. **Show error message** - notify user that the update failed

## Summary

| Issue | Cause | Effect |
|-------|-------|--------|
| **500 Error** | Backend SQL/date conversion error | API calls fail |
| **Mark Complete** | Optimistic update + API failure + no rollback | UI shows wrong state until reload |

## Next Steps

1. **Check backend logs** to see the actual SQL error
2. **Fix the backend error** (likely date conversion or missing column)
3. **Add error handling** to revert optimistic updates on failure
4. **Test** - mark as complete should work without reload

