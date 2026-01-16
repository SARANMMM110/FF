/**
 * Recurring Tasks Processor
 * 
 * This module handles the automatic generation of recurring task instances.
 * It should be called periodically (e.g., via a scheduled cron job) to:
 * 1. Find recurring tasks that need new instances generated
 * 2. Create new task instances based on the recurrence pattern
 * 3. Update the parent task's next_occurrence_date
 */

interface RecurringTask {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  priority: number;
  estimated_minutes: number | null;
  project: string | null;
  tags: string | null;
  repeat: "daily" | "weekly" | "monthly";
  repeat_detail: string | null;
  due_date: string;
  next_occurrence_date: string;
}

export function calculateNextOccurrence(
  currentDate: string,
  repeat: "none" | "daily" | "weekly" | "monthly",
  repeatDetail: string | null
): string | null {
  if (repeat === "none") return null;

  const current = new Date(currentDate);
  let next = new Date(current);

  switch (repeat) {
    case "daily":
      // Add 1 day
      next.setDate(next.getDate() + 1);
      break;

    case "weekly":
      if (!repeatDetail) {
        // Default to same day next week
        next.setDate(next.getDate() + 7);
      } else {
        // Parse the days from repeat_detail
        const selectedDays = JSON.parse(repeatDetail) as string[];
        const dayMap: Record<string, number> = {
          sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
        };

        // Find the next occurrence day
        const currentDay = current.getDay();
        const selectedDayNumbers = selectedDays.map(d => dayMap[d]).sort((a, b) => a - b);

        // Find next day in the pattern
        let daysToAdd = 0;
        let foundNext = false;

        for (const dayNum of selectedDayNumbers) {
          if (dayNum > currentDay) {
            daysToAdd = dayNum - currentDay;
            foundNext = true;
            break;
          }
        }

        // If no day found this week, use first day of next week
        if (!foundNext) {
          daysToAdd = 7 - currentDay + selectedDayNumbers[0];
        }

        next.setDate(next.getDate() + daysToAdd);
      }
      break;

    case "monthly":
      // Same day next month
      next.setMonth(next.getMonth() + 1);
      // Handle edge cases (e.g., Jan 31 -> Feb 28/29)
      if (next.getDate() !== current.getDate()) {
        next.setDate(0); // Last day of previous month
      }
      break;
  }

  return next.toISOString().split('T')[0];
}

export async function processRecurringTasks(db: D1Database): Promise<{
  processed: number;
  created: number;
  errors: string[];
}> {
  const today = new Date().toISOString().split('T')[0];
  const errors: string[] = [];
  let processed = 0;
  let created = 0;

  try {
    // Find all recurring tasks where next_occurrence_date <= today
    const { results } = await db.prepare(`
      SELECT * FROM tasks 
      WHERE \`repeat\` != 'none' 
        AND next_occurrence_date IS NOT NULL 
        AND next_occurrence_date <= ?
        AND parent_recurring_task_id IS NULL
    `).bind(today).all();

    const recurringTasks = results as unknown as RecurringTask[];

    console.log(`🔄 [Recurring Tasks] Found ${recurringTasks.length} tasks to process`);

    for (const task of recurringTasks) {
      try {
        processed++;

        // Create new task instance
        const newDueDate = task.next_occurrence_date;
        
        await db.prepare(`
          INSERT INTO tasks (
            user_id, title, description, priority, estimated_minutes, 
            project, tags, status, due_date, parent_recurring_task_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?)
        `).bind(
          task.user_id,
          task.title,
          task.description,
          task.priority,
          task.estimated_minutes,
          task.project,
          task.tags,
          newDueDate,
          task.id
        ).run();

        created++;
        console.log(`✅ [Recurring Tasks] Created instance for task ${task.id} with due date ${newDueDate}`);

        // Calculate and update next occurrence
        const nextOccurrence = calculateNextOccurrence(
          newDueDate,
          task.repeat,
          task.repeat_detail
        );

        await db.prepare(`
          UPDATE tasks 
          SET next_occurrence_date = ?, updated_at = ?
          WHERE id = ?
        `).bind(
          nextOccurrence,
          new Date().toISOString(),
          task.id
        ).run();

        console.log(`📅 [Recurring Tasks] Updated task ${task.id} next occurrence to ${nextOccurrence}`);

      } catch (error) {
        const errorMsg = `Failed to process recurring task ${task.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ [Recurring Tasks] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`🎉 [Recurring Tasks] Completed: ${created} tasks created from ${processed} recurring patterns`);

    return { processed, created, errors };

  } catch (error) {
    const errorMsg = `Recurring tasks processor failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ [Recurring Tasks] ${errorMsg}`);
    errors.push(errorMsg);
    return { processed, created, errors };
  }
}
