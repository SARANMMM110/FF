/**
 * Google Calendar Integration
 * Provides real calendar data from Google Calendar API
 */

import { apiFetch } from "@/react-app/utils/api";

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  color?: string;
  attendees?: string[];
  is_all_day: boolean;
}

export interface CalendarConnection {
  connected: boolean;
  provider?: string;
  connectedAt?: string;
}

/**
 * Check if calendar is connected
 */
export async function getCalendarStatus(): Promise<CalendarConnection> {
  try {
    const response = await apiFetch("api/calendar/status");
    if (!response.ok) {
      throw new Error("Failed to check calendar status");
    }
    return await response.json();
  } catch (error) {
    console.error("Calendar status check failed:", error);
    return { connected: false };
  }
}

/**
 * Get Google Calendar OAuth URL
 */
export async function getCalendarAuthUrl(): Promise<string> {
  const response = await apiFetch("api/calendar/auth-url");
  if (!response.ok) {
    throw new Error("Failed to get calendar auth URL");
  }
  const data = await response.json();
  return data.authUrl;
}

/**
 * Disconnect calendar
 */
export async function disconnectCalendar(): Promise<void> {
  const response = await apiFetch("api/calendar/disconnect", {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Failed to disconnect calendar");
  }
}

/**
 * Fetch calendar events
 */
export async function getCalendarEvents(from?: Date, to?: Date): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  
  if (from) {
    params.set("from", from.toISOString());
  }
  if (to) {
    params.set("to", to.toISOString());
  }

  const response = await apiFetch(`api/calendar/events?${params.toString()}`);
  
  if (response.status === 401) {
    // Calendar not connected
    return [];
  }
  
  if (!response.ok) {
    throw new Error("Failed to fetch calendar events");
  }

  const data = await response.json();
  return data.events || [];
}

/**
 * Get today's calendar events
 */
export async function getTodaysEvents(): Promise<CalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getCalendarEvents(today, tomorrow);
}

/**
 * Format time for display
 */
export function formatEventTime(startTime: string, endTime: string, isAllDay: boolean): string {
  if (isAllDay) {
    return "All day";
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const startStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Check if an event is currently happening
 */
export function isEventActive(startTime: string, endTime: string): boolean {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return now >= start && now <= end;
}

/**
 * Check if an event is upcoming (within next 2 hours)
 */
export function isEventUpcoming(startTime: string): boolean {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const twoHoursFromNow = now + 2 * 60 * 60 * 1000;

  return start > now && start <= twoHoursFromNow;
}
