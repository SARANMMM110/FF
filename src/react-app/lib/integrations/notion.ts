import type { Task } from "@/shared/types";

/**
 * Notion Integration
 * 
 * This module provides full Notion API integration for syncing completed tasks
 * to a Notion database. Users can connect their Notion workspace and specify
 * which database to sync tasks to.
 */

export interface NotionSyncPayload {
  task_id: number;
  title: string;
  status: string;
  priority: number;
  completed_at: string | null;
  project: string | null;
  tags: string[] | null;
  actual_minutes: number;
  synced_at: string;
}

/**
 * Sync a completed task to Notion database
 * 
 * @param task - The completed task to sync
 * @param accessToken - Notion integration token
 * @param databaseId - Target Notion database ID
 * @returns Promise resolving to sync success status
 */
export async function syncTask(
  task: Task,
  accessToken: string,
  databaseId: string
): Promise<{ success: boolean; message: string; pageId?: string }> {
  try {
    // Parse tags if they exist
    let tagsArray: string[] = [];
    if (task.tags) {
      try {
        tagsArray = JSON.parse(task.tags);
      } catch {
        // If parsing fails, treat as comma-separated string
        tagsArray = task.tags.split(',').map(t => t.trim());
      }
    }

    // Build Notion page properties
    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: task.title
            }
          }
        ]
      }
    };

    // Add optional properties if they exist in the database
    if (task.status) {
      properties.Status = {
        select: {
          name: task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')
        }
      };
    }

    if (task.priority !== undefined && task.priority !== null) {
      properties.Priority = {
        number: task.priority
      };
    }

    if (task.project) {
      properties.Project = {
        select: {
          name: task.project
        }
      };
    }

    if (tagsArray.length > 0) {
      properties.Tags = {
        multi_select: tagsArray.map(tag => ({ name: tag }))
      };
    }

    if (task.completed_at) {
      properties["Completed At"] = {
        date: {
          start: task.completed_at
        }
      };
    }

    if (task.actual_minutes) {
      properties["Time Spent"] = {
        number: task.actual_minutes
      };
    }

    // Add description as page content
    const children: any[] = [];
    if (task.description) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: task.description
              }
            }
          ]
        }
      });
    }

    // Create page in Notion
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId
        },
        properties,
        children: children.length > 0 ? children : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Notion API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: `Task "${task.title}" synced to Notion successfully`,
      pageId: data.id
    };
  } catch (error) {
    console.error("❌ [Notion] Sync failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Verify Notion database access
 * 
 * @param accessToken - Notion integration token
 * @param databaseId - The Notion database ID to verify
 * @returns Promise resolving to verification status
 */
export async function verifyDatabaseAccess(
  accessToken: string,
  databaseId: string
): Promise<{ success: boolean; message: string; databaseName?: string }> {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: "Database not found. Make sure you've shared it with your integration."
        };
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Notion API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: "Database access verified successfully",
      databaseName: data.title?.[0]?.plain_text || "Untitled Database"
    };
  } catch (error) {
    console.error("❌ [Notion] Verification failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Get Notion database properties
 * 
 * @param accessToken - Notion integration token
 * @param databaseId - The Notion database ID
 * @returns Promise resolving to database schema
 */
export async function getDatabaseSchema(
  accessToken: string,
  databaseId: string
): Promise<{ success: boolean; properties?: any; message?: string }> {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Notion API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      properties: data.properties
    };
  } catch (error) {
    console.error("❌ [Notion] Schema fetch failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
