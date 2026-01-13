import { useEffect, useState } from "react";
import { Calendar, MapPin, Users, Loader2, ExternalLink } from "lucide-react";
import { getCalendarProvider, formatEventTime, isEventActive, isEventUpcoming } from "@/react-app/lib/integrations/calendar";
import type { CalendarEvent } from "@/react-app/lib/integrations/calendar";

export default function TodaysCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const provider = getCalendarProvider();
        const connected = await provider.isConnected();
        setIsConnected(connected);

        if (connected) {
          const todaysEvents = await provider.getTodaysEvents();
          setEvents(todaysEvents);
        }
      } catch (error) {
        console.error("Failed to load calendar events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Today's Calendar</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Today's Calendar</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4285F4]/10 to-[#34A853]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#4285F4]" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your Google Calendar to see your events here
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#357ae8] hover:to-[#2d9249] text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
          >
            Connect Calendar
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Today's Calendar</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No events scheduled for today
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Enjoy your free time!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Today's Calendar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {events.length} event{events.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event) => {
          const active = isEventActive(event.start_time, event.end_time);
          const upcoming = isEventUpcoming(event.start_time);
          
          return (
            <div
              key={event.id}
              className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                active
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                  : upcoming
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {active && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                    {upcoming && !active && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                        SOON
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {event.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formatEventTime(event.start_time, event.end_time, event.is_all_day)}
                  </p>

                  {event.location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {event.attendees.length} attendee{event.attendees.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
