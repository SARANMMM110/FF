export interface ParsedTaskData {
  title: string;
  project?: string;
  priority?: number;
  due_date?: string;
  tags?: string[];
  estimated_minutes?: number;
}

export function parseSmartInput(input: string): ParsedTaskData {
  let title = input;
  const result: ParsedTaskData = { title };

  // Extract project: #project
  const projectMatch = title.match(/#(\w+)/);
  if (projectMatch) {
    result.project = projectMatch[1];
    title = title.replace(projectMatch[0], "").trim();
  }

  // Extract priority: p:low, p:medium, p:high or p:0, p:1, p:2
  const priorityMatch = title.match(/p:(low|medium|high|0|1|2)/i);
  if (priorityMatch) {
    const priority = priorityMatch[1].toLowerCase();
    if (priority === "low" || priority === "0") result.priority = 0;
    else if (priority === "medium" || priority === "1") result.priority = 1;
    else if (priority === "high" || priority === "2") result.priority = 2;
    title = title.replace(priorityMatch[0], "").trim();
  }

  // Extract tags: @tag
  const tagMatches = title.match(/@(\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1));
    tagMatches.forEach(tag => {
      title = title.replace(tag, "").trim();
    });
  }

  // Extract time estimates: 25m, 1h, 30min
  const timeMatch = title.match(/(\d+)(m|min|h|hour|hours)/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit === "h" || unit === "hour" || unit === "hours") {
      result.estimated_minutes = value * 60;
    } else {
      result.estimated_minutes = value;
    }
    title = title.replace(timeMatch[0], "").trim();
  }

  // Extract due date: @today, @tomorrow, @mon, @tue, etc., or @2025-10-25
  const dueDateMatch = title.match(/@(today|tomorrow|mon|tue|wed|thu|fri|sat|sun|\d{4}-\d{2}-\d{2})/i);
  if (dueDateMatch) {
    const dateStr = dueDateMatch[1].toLowerCase();
    const now = new Date();
    
    if (dateStr === "today") {
      result.due_date = now.toISOString().split("T")[0];
    } else if (dateStr === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.due_date = tomorrow.toISOString().split("T")[0];
    } else if (["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(dateStr)) {
      const dayMap: Record<string, number> = {
        sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
      };
      const targetDay = dayMap[dateStr];
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      result.due_date = targetDate.toISOString().split("T")[0];
    } else if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
      result.due_date = dateStr;
    }
    title = title.replace(dueDateMatch[0], "").trim();
  }

  // Clean up multiple spaces
  result.title = title.replace(/\s+/g, " ").trim();

  return result;
}
