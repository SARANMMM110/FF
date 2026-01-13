/**
 * Calendar Integration Provider
 * 
 * This module provides an interface for calendar event fetching.
 * It uses the Google Calendar API integration to fetch real calendar events.
 */

import { 
  getTodaysEvents as getGoogleTodaysEvents, 
  getCalendarEvents, 
  getCalendarStatus 
} from "./googleCalendar";

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

export interface CalendarProvider {
  getTodaysEvents(): Promise<CalendarEvent[]>;
  getEventsInRange(start: Date, end: Date): Promise<CalendarEvent[]>;
  isConnected(): Promise<boolean>;
}

/**
 * Google Calendar Provider
 * 
 * Fetches real calendar events from Google Calendar API
 */
class GoogleCalendarProvider implements CalendarProvider {
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    try {
      const events = await getGoogleTodaysEvents();
      return events;
    } catch (error) {
      console.error("Failed to fetch today's events:", error);
      return [];
    }
  }

  async getEventsInRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    try {
      const events = await getCalendarEvents(start, end);
      return events;
    } catch (error) {
      console.error("Failed to fetch events in range:", error);
      return [];
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const status = await getCalendarStatus();
      return status.connected;
    } catch (error) {
      console.error("Failed to check calendar status:", error);
      return false;
    }
  }
}

/**
 * Get the current calendar provider instance
 * 
 * Returns GoogleCalendarProvider for real calendar integration
 */
export function getCalendarProvider(): CalendarProvider {
  return new GoogleCalendarProvider();
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
