import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Clock, Globe, TrendingUp } from "lucide-react";

interface FocusGuardWarningProps {
  isVisible: boolean;
  timeAwaySeconds: number;
  totalDistractions: number;
  blockedSite?: string | null;
  onReturn: () => void;
}

export default function FocusGuardWarning({
  isVisible,
  timeAwaySeconds,
  totalDistractions,
  blockedSite,
  onReturn,
}: FocusGuardWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState("");

  const quotes = [
    "Deep work is rare and valuable. Every moment counts.",
    "Your goals are worth more than a moment of distraction.",
    "Focus is your superpower. Use it wisely.",
    "Great things never came from comfort zones.",
    "Discipline is choosing between what you want now and what you want most.",
    "Your future self will thank you for staying focused.",
    "Every distraction is a choice. Choose your goals.",
    "The harder the battle, the sweeter the victory.",
  ];

  useEffect(() => {
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [timeAwaySeconds]);

  useEffect(() => {
    if (!isVisible && timeAwaySeconds > 0) {
      // Show warning after 3 seconds of being away
      const timer = setTimeout(() => {
        setShowWarning(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else if (isVisible) {
      setShowWarning(false);
    }
  }, [isVisible, timeAwaySeconds]);

  if (!showWarning || isVisible) return null;

  const minutes = Math.floor(timeAwaySeconds / 60);
  const seconds = timeAwaySeconds % 60;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in">
      <div className="max-w-2xl mx-auto p-8 text-center">
        {/* Warning Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-full flex items-center justify-center animate-bounce">
            <AlertTriangle className="w-16 h-16 text-black" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-5xl font-bold text-white mb-4 animate-slide-in-up">
          {blockedSite ? "Distraction Detected!" : "You Left Your Focus Session!"}
        </h1>
        
        <p className="text-2xl text-gray-300 mb-8 animate-slide-in-up delay-100">
          {blockedSite ? (
            <>Time spent on distracting sites adds up 📊</>
          ) : (
            <>Come back and stay on track 🎯</>
          )}
        </p>

        {/* Blocked Site Alert */}
        {blockedSite && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 backdrop-blur-sm border-2 border-[#E50914]/50 rounded-2xl animate-slide-in-up delay-150">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-6 h-6 text-[#FFD400]" />
              <h3 className="text-xl font-bold text-white">Visited Distraction Site</h3>
            </div>
            <p className="text-lg text-gray-300 font-mono">
              {blockedSite}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              This site is on your distraction awareness list
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8 animate-slide-in-up delay-200">
          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6">
            <Clock className="w-8 h-8 text-[#FFD400] mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
            </div>
            <div className="text-sm text-gray-400">Time Away</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6">
            <AlertTriangle className="w-8 h-8 text-[#E50914] mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {totalDistractions}
            </div>
            <div className="text-sm text-gray-400">Distractions</div>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={onReturn}
          className="group relative px-12 py-6 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl font-bold text-2xl text-black hover:shadow-2xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105 animate-slide-in-up delay-300"
        >
          <div className="flex items-center gap-4">
            <ArrowLeft className="w-8 h-8 group-hover:-translate-x-2 transition-transform duration-300" />
            <span>Return to Focus</span>
          </div>
        </button>

        {/* Motivational Quote */}
        <p className="mt-8 text-lg text-gray-400 italic animate-slide-in-up delay-400">
          "{motivationalQuote}"
        </p>
        
        {/* Progress Insight */}
        {totalDistractions > 3 && (
          <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-slide-in-up delay-500">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>You've been distracted {totalDistractions} times this session</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out forwards;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
