import { useState, useEffect } from "react";
import { useSettings } from "@/react-app/hooks/useSettings";
import { Plus, X, Globe, AlertTriangle } from "lucide-react";

export default function BlockedWebsitesManager() {
  const { settings, updateSettings } = useSettings();
  const [websites, setWebsites] = useState<string[]>([]);
  const [newWebsite, setNewWebsite] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (settings?.blocked_websites) {
      try {
        const parsed = JSON.parse(settings.blocked_websites);
        setWebsites(Array.isArray(parsed) ? parsed : []);
      } catch {
        setWebsites([]);
      }
    }
  }, [settings]);

  const handleAdd = async () => {
    if (!newWebsite.trim()) return;

    // Clean the URL - remove protocol and www if present
    let cleanUrl = newWebsite.trim().toLowerCase();
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
    cleanUrl = cleanUrl.replace(/\/$/, ''); // Remove trailing slash

    // Don't add duplicates
    if (websites.includes(cleanUrl)) {
      setNewWebsite("");
      return;
    }

    const updatedWebsites = [...websites, cleanUrl];
    setWebsites(updatedWebsites);
    
    await updateSettings({
      blocked_websites: JSON.stringify(updatedWebsites),
    });

    setNewWebsite("");
    setIsAdding(false);
  };

  const handleRemove = async (websiteToRemove: string) => {
    const updatedWebsites = websites.filter(w => w !== websiteToRemove);
    setWebsites(updatedWebsites);
    
    await updateSettings({
      blocked_websites: JSON.stringify(updatedWebsites),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewWebsite("");
    }
  };

  const commonDistractions = [
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
    "reddit.com",
    "tiktok.com",
    "netflix.com",
    "twitch.tv"
  ];

  const quickAddSuggestions = commonDistractions.filter(
    site => !websites.includes(site)
  ).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Website List */}
      {websites.length > 0 && (
        <div className="space-y-2">
          {websites.map((website) => (
            <div
              key={website}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group hover:border-[#E50914]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E50914]/20 to-[#FFD400]/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#E50914]" />
                </div>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {website}
                </span>
              </div>
              <button
                onClick={() => handleRemove(website)}
                className="p-1.5 text-gray-400 hover:text-[#E50914] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Website */}
      {isAdding ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="e.g., youtube.com, twitter.com"
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-[#E50914] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/20"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg font-semibold text-black hover:shadow-lg transition-all duration-300"
            >
              Add Website
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewWebsite("");
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter to add, Esc to cancel
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#E50914]/50"
        >
          <Plus className="w-5 h-5" />
          Add Website
        </button>
      )}

      {/* Quick Add Suggestions */}
      {!isAdding && quickAddSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            QUICK ADD COMMON DISTRACTIONS:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickAddSuggestions.map((site) => (
              <button
                key={site}
                onClick={async () => {
                  const updatedWebsites = [...websites, site];
                  setWebsites(updatedWebsites);
                  await updateSettings({
                    blocked_websites: JSON.stringify(updatedWebsites),
                  });
                }}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-[#E50914]/10 hover:to-[#FFD400]/10 border border-gray-200 dark:border-gray-700 hover:border-[#E50914]/50 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
              >
                + {site}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-semibold">How Focus Guard Works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Tracks when you switch tabs during focus sessions</li>
              <li>Shows gentle reminders to help you stay focused</li>
              <li>Records distraction patterns for your analytics</li>
              <li>All tracking happens locally in your browser</li>
            </ul>
            <p className="text-xs italic mt-2">
              Note: This feature cannot actually block websites - it's designed to increase awareness and encourage better focus habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
