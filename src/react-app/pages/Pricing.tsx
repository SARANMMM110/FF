import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import PricingPlans from "@/react-app/components/PricingPlans";
import Layout from "@/react-app/components/Layout";

export default function PricingPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Plan</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            Start free forever. Upgrade to unlock advanced features, integrations, and team collaboration tools.
          </p>
        </div>

        {/* Pricing */}
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <PricingPlans />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-12 text-center">
            <p className="text-gray-500 text-sm">
              Questions? Contact us at hello@focusflow.app
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Plans</h1>
          <p className="text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>

        <PricingPlans />

        {/* Current Plan Status */}
        <div className="mt-12 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Forever</p>
              <p className="text-gray-400 text-sm">You're currently on the free plan with full access to core features.</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg font-medium text-black hover:shadow-lg transition-all duration-300">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
