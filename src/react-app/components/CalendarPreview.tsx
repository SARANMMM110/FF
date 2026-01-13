import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { getCalendarProvider, formatEventTime, isEventActive, isEventUpcoming, type CalendarEvent } from "@/react-app/lib/integrations/calendar";

export default function CalendarPreview() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const calendarProvider = getCalendarProvider();
        const todaysEvents = await calendarProvider.getTodaysEvents();
        setEvents(todaysEvents);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[#4285F4]" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            Today's Schedule
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            Today's Schedule
          </h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[#4285F4]" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
          Today's Schedule
        </h3>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-gray-600 dark:text-gray-300 italic">
          No events scheduled for today
        </p>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 4).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {events.length > 4 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
              +{events.length - 4} more events
            </p>
          )}
        </div>
      )}

      {/* Mock data notice */}
      <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Preview:</strong> Showing mock calendar data. Connect Google Calendar for real events.
        </p>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const isActive = isEventActive(event.start_time, event.end_time);
  const isUpcoming = isEventUpcoming(event.start_time);

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${
        isActive
          ? "bg-green-50 dark:bg-green-900/20 border-green-500"
          : isUpcoming
          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
          : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
          {event.title}
        </h4>
        {isActive && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mb-2">
        <Clock className="w-3 h-3" />
        <span>{formatEventTime(event.start_time, event.end_time, event.is_all_day)}</span>
      </div>

      {event.location && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mb-1">
          <MapPin className="w-3 h-3" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      )}

      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
          <Users className="w-3 h-3" />
          <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
