import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router";
import { useSettings } from "@/react-app/hooks/useSettings";
import { getCalendarStatus, disconnectCalendar } from "@/react-app/lib/integrations/googleCalendar";
import { useToast } from "@/react-app/hooks/useToast";
import { ToastContainer } from "@/react-app/components/Toast";
import { useSubscription } from "@/react-app/hooks/useSubscription";
import ProUpgradeModal from "@/react-app/components/ProUpgradeModal";
import BlockedWebsitesManager from "@/react-app/components/BlockedWebsitesManager";
import Layout from "@/react-app/components/Layout";
import { Loader2, Save, Clock, Repeat, Shield, Sparkles, Link2, Check, X, Crown } from "lucide-react";

export default function Settings() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings, loading, updateSettings } = useSettings();
  const { toasts, addToast, removeToast } = useToast();
  const { isPro, isEnterprise } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState(4);
  const [minimalModeEnabled, setMinimalModeEnabled] = useState(false);
  const [showMotivationalPrompts, setShowMotivationalPrompts] = useState(true);
  const [notionSyncEnabled, setNotionSyncEnabled] = useState(false);
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [notionAccessToken, setNotionAccessToken] = useState("");
  const [customThemeEnabled, setCustomThemeEnabled] = useState(false);
  const [customThemePrimary, setCustomThemePrimary] = useState("#E50914");
  const [customThemeSecondary, setCustomThemeSecondary] = useState("#FFD400");
  const [customThemeAccent, setCustomThemeAccent] = useState("#FF6B6B");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [showCalendarComingSoon, setShowCalendarComingSoon] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    // Check for calendar connection status from URL params
    const connected = searchParams.get("calendar_connected");
    const error = searchParams.get("calendar_error");
    
    if (connected === "true") {
      addToast("Google Calendar connected successfully!", "success");
      setCalendarConnected(true);
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      addToast(`Calendar connection failed: ${error}`, "error");
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, addToast]);

  useEffect(() => {
    async function checkCalendarStatus() {
      if (user) {
        const status = await getCalendarStatus();
        setCalendarConnected(status.connected);
        setCalendarLoading(false);
      }
    }
    checkCalendarStatus();
  }, [user]);

  useEffect(() => {
    if (settings) {
      setFocusDuration(settings.focus_duration_minutes);
      setShortBreak(settings.short_break_minutes);
      setLongBreak(settings.long_break_minutes);
      setCyclesBeforeLong(settings.cycles_before_long_break);
      setMinimalModeEnabled(settings.minimal_mode_enabled === 1);
      setShowMotivationalPrompts(settings.show_motivational_prompts === 1);
      setNotionSyncEnabled((settings as any).notion_sync_enabled === 1);
      setNotionDatabaseId((settings as any).notion_database_id || "");
      setNotionAccessToken((settings as any).notion_access_token || "");
      setCustomThemeEnabled((settings as any).custom_theme_enabled === 1);
      setCustomThemePrimary((settings as any).custom_theme_primary || "#E50914");
      setCustomThemeSecondary((settings as any).custom_theme_secondary || "#FFD400");
      setCustomThemeAccent((settings as any).custom_theme_accent || "#FF6B6B");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateSettings({
        focus_duration_minutes: focusDuration,
        short_break_minutes: shortBreak,
        long_break_minutes: longBreak,
        cycles_before_long_break: cyclesBeforeLong,
        minimal_mode_enabled: minimalModeEnabled ? 1 : 0,
        show_motivational_prompts: showMotivationalPrompts ? 1 : 0,
        notion_sync_enabled: notionSyncEnabled ? 1 : 0,
        notion_database_id: notionDatabaseId || null,
        notion_access_token: notionAccessToken || null,
        custom_theme_enabled: customThemeEnabled ? 1 : 0,
        custom_theme_primary: customThemePrimary,
        custom_theme_secondary: customThemeSecondary,
        custom_theme_accent: customThemeAccent,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar?")) {
      return;
    }
    
    try {
      await disconnectCalendar();
      setCalendarConnected(false);
      addToast("Google Calendar disconnected", "success");
    } catch (error) {
      addToast("Failed to disconnect calendar", "error");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="animate-spin">
          <Loader2 className="w-12 h-12 text-[#E50914]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Customize your focus timer and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Timer Durations */}
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timer Durations
            </h2>
            
            <div className="space-y-5">
              <SettingInput
                label="Focus Duration"
                value={focusDuration}
                onChange={setFocusDuration}
                min={1}
                max={60}
                unit="minutes"
                description="How long each focus session lasts"
              />
              
              <SettingInput
                label="Short Break"
                value={shortBreak}
                onChange={setShortBreak}
                min={1}
                max={30}
                unit="minutes"
                description="Brief break between focus sessions"
              />
              
              <SettingInput
                label="Long Break"
                value={longBreak}
                onChange={setLongBreak}
                min={5}
                max={60}
                unit="minutes"
                description="Extended break after multiple cycles"
              />
            </div>
          </div>

          {/* Cycle Settings */}
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Cycle Settings
            </h2>
            
            <SettingInput
              label="Cycles Before Long Break"
              value={cyclesBeforeLong}
              onChange={setCyclesBeforeLong}
              min={2}
              max={10}
              unit="cycles"
              description="Number of focus sessions before taking a long break"
            />
          </div>

          {/* Distraction Controls */}
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Focus Guard & Distraction Controls
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={minimalModeEnabled}
                    onChange={(e) => setMinimalModeEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#E50914] focus:ring-[#E50914] focus:ring-offset-0"
                  />
                  <div>
                    <span className="font-semibold group-hover:text-[#E50914] transition-colors">
                      Auto-enable Minimal Mode
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Automatically enter distraction-free mode when focus timer starts
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showMotivationalPrompts}
                    onChange={(e) => setShowMotivationalPrompts(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#E50914] focus:ring-[#E50914] focus:ring-offset-0"
                  />
                  <div>
                    <span className="font-semibold group-hover:text-[#E50914] transition-colors">
                      Show Motivational Prompts
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Display rotating micro-prompts during focus sessions
                    </p>
                  </div>
                </label>
              </div>

              {/* Blocked Websites Management */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Distraction Awareness List</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add websites that tend to distract you. When you leave the app to visit these sites during a focus session, you'll see a gentle reminder about your goals.
                </p>
                
                <BlockedWebsitesManager />
              </div>
            </div>
          </div>

          {/* Custom Theme (Pro Feature) */}
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Custom Theme
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Personalize your FocusFlow experience with custom colors
                </p>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full text-xs font-bold text-black">
                PRO
              </span>
            </div>
            
            <div className="space-y-5">
              <label className={`flex items-center gap-3 ${(isPro || isEnterprise) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} group`}>
                <input
                  type="checkbox"
                  checked={customThemeEnabled}
                  onChange={(e) => {
                    if (isPro || isEnterprise) {
                      setCustomThemeEnabled(e.target.checked);
                    } else {
                      setUpgradeFeature("Custom Themes");
                      setShowUpgradeModal(true);
                    }
                  }}
                  disabled={!isPro && !isEnterprise}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#E50914] focus:ring-[#E50914] focus:ring-offset-0 disabled:opacity-50"
                />
                <div>
                  <span className="font-semibold group-hover:text-[#E50914] transition-colors flex items-center gap-2">
                    Enable Custom Theme
                    {!isPro && !isEnterprise && <Crown className="w-4 h-4 text-[#FFD400]" />}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {(isPro || isEnterprise) 
                      ? "Use your own brand colors throughout the app"
                      : "Upgrade to Pro to customize your theme colors"
                    }
                  </p>
                </div>
              </label>

              {customThemeEnabled && (
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customThemePrimary}
                        onChange={(e) => setCustomThemePrimary(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-700"
                      />
                      <input
                        type="text"
                        value={customThemePrimary}
                        onChange={(e) => setCustomThemePrimary(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#E50914"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customThemeSecondary}
                        onChange={(e) => setCustomThemeSecondary(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-700"
                      />
                      <input
                        type="text"
                        value={customThemeSecondary}
                        onChange={(e) => setCustomThemeSecondary(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#FFD400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customThemeAccent}
                        onChange={(e) => setCustomThemeAccent(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-700"
                      />
                      <input
                        type="text"
                        value={customThemeAccent}
                        onChange={(e) => setCustomThemeAccent(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#FF6B6B"
                      />
                    </div>
                  </div>
                </div>
              )}

              {customThemeEnabled && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-3">Theme Preview</h4>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-16 h-16 rounded-xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${customThemePrimary}, ${customThemeSecondary})` }}
                    />
                    <div className="flex-1">
                      <div 
                        className="h-8 rounded-lg mb-2"
                        style={{ backgroundColor: customThemePrimary }}
                      />
                      <div 
                        className="h-8 rounded-lg mb-2"
                        style={{ backgroundColor: customThemeSecondary }}
                      />
                      <div 
                        className="h-8 rounded-lg"
                        style={{ backgroundColor: customThemeAccent }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Integrations
              </h2>
            </div>
            
            <div className="space-y-5">
              {/* Notion Integration */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Notion</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Sync completed tasks to your Notion database
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group mb-4">
                  <input
                    type="checkbox"
                    checked={notionSyncEnabled}
                    onChange={(e) => setNotionSyncEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#E50914] focus:ring-[#E50914] focus:ring-offset-0"
                  />
                  <span className="font-semibold group-hover:text-[#E50914] transition-colors">
                    Enable Notion sync
                  </span>
                </label>

                {notionSyncEnabled && (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Notion Integration Token
                      </span>
                      <input
                        type="password"
                        value={notionAccessToken}
                        onChange={(e) => setNotionAccessToken(e.target.value)}
                        placeholder="secret_xxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 italic mt-1">
                        ⓘ Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">notion.so/my-integrations</a>
                      </p>
                    </label>
                    
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Notion Database ID
                      </span>
                      <input
                        type="text"
                        value={notionDatabaseId}
                        onChange={(e) => setNotionDatabaseId(e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 italic mt-1">
                        ⓘ Find your database ID in the URL: notion.so/[workspace]/[DATABASE_ID]?v=...
                      </p>
                    </label>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-2">Setup Instructions:</h4>
                      <ol className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
                        <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline">notion.so/my-integrations</a></li>
                        <li>Create a new integration and copy the "Internal Integration Token"</li>
                        <li>Open your Notion database and click "..." → "Add connections" → Select your integration</li>
                        <li>Copy the database ID from the URL (32 character string)</li>
                        <li>Paste both values above and save settings</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        ✓ Once configured, completed tasks will automatically sync to your Notion database with properties: Name, Status, Priority, Project, Tags, Completed At, and Time Spent.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Calendar Integration (Pro Feature) - HIDDEN FOR NOW */}
              {false && <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-800 relative">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      Google Calendar
                      {!calendarLoading && calendarConnected && (isPro || isEnterprise) && (
                        <span className="flex items-center gap-1 text-xs font-normal bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full text-xs font-bold text-black">
                        PRO
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(isPro || isEnterprise)
                        ? "View today's events in your dashboard"
                        : "Upgrade to Pro to sync your Google Calendar"
                      }
                    </p>
                  </div>
                </div>

                {!isPro && !isEnterprise ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 border border-[#FFD400]/30 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                        <Crown className="w-4 h-4 text-[#FFD400]" />
                        <strong>Pro Feature:</strong> Connect your Google Calendar to see events in your dashboard
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-6 list-disc">
                        <li>View today's calendar events while planning tasks</li>
                        <li>Better schedule your focus sessions around meetings</li>
                        <li>Read-only access - we never modify your calendar</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setUpgradeFeature("Google Calendar Integration");
                        setShowUpgradeModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] hover:shadow-lg text-black rounded-lg font-bold transition-all duration-300"
                    >
                      <Crown className="w-5 h-5" />
                      Upgrade to Pro
                    </button>
                  </div>
                ) : calendarLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : calendarConnected ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Your Google Calendar is connected and syncing events
                      </p>
                    </div>
                    <button
                      onClick={handleDisconnectCalendar}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Disconnect Calendar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect your Google Calendar to see your events in FocusFlow and better plan your focus sessions.
                    </p>
                    <button
                      onClick={() => setShowCalendarComingSoon(true)}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#357ae8] hover:to-[#2d9249] text-white rounded-lg font-bold transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                        <span className="text-[#4285F4] font-bold text-xs">G</span>
                      </div>
                      Connect Google Calendar
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-600 italic">
                      ⓘ We only request read-only access to your calendar. We never modify or delete your events.
                    </p>
                  </div>
                )}
              </div>}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-lg text-black hover:shadow-xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
            {saveSuccess && (
              <div className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                ✓ Saved successfully
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />

      {/* Calendar Coming Soon Modal */}
      {showCalendarComingSoon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border-2 border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowCalendarComingSoon(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">📅</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">Calendar Feature Will Be Live Soon</h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We're working hard to bring you Google Calendar integration. Stay tuned for updates!
              </p>
              
              <button
                onClick={() => setShowCalendarComingSoon(false)}
                className="w-full py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] hover:shadow-lg text-black rounded-lg font-bold transition-all duration-300"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SettingInput({ label, value, onChange, min, max, unit, description }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold">{label}</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            min={min}
            max={max}
            className="w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="w-20 text-right">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value) || min)}
              min={min}
              max={max}
              className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-center font-semibold"
            />
          </div>
          <span className="text-gray-600 dark:text-gray-300 text-sm w-16">{unit}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
