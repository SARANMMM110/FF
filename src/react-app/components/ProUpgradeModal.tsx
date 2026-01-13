import { X, Crown, Sparkles, Check, ArrowRight } from "lucide-react";

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

const PRO_FEATURES = [
  "Advanced analytics & reporting",
  "Calendar integration with Google",
  "Goal setting and progress tracking",
  "Custom themes and colors",
  "Advanced automation rules",
  "Time tracking insights",
  "Priority email support",
  "Unlimited projects and tags"
];

export default function ProUpgradeModal({ isOpen, onClose, feature }: ProUpgradeModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Scroll to pricing section on home page
    window.location.href = "/#pricing";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-[#FFD400]/30 rounded-3xl shadow-2xl overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 animate-pulse"></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="relative p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl mb-6 animate-bounce">
              <Crown className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
                Upgrade to Pro
              </span>
            </h2>
            <p className="text-gray-300 text-lg">
              Unlock <span className="font-bold text-white">{feature}</span> and all premium features
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {PRO_FEATURES.map((feat, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="mt-0.5 p-1 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full flex-shrink-0">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-gray-200 text-sm">{feat}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 border border-[#FFD400]/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pro Plan</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">$9</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Join thousands of productive professionals
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpgrade}
              className="flex-1 group px-8 py-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-lg text-black hover:shadow-2xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                Upgrade to Pro
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
