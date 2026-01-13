import { Check, Zap, Crown, Star, ArrowRight } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free Forever",
    price: 0,
    period: "month",
    description: "Perfect for individuals getting started with productivity",
    features: [
      "Unlimited tasks and projects",
      "Pomodoro timer with customization",
      "Basic analytics and insights",
      "Weekly planner view",
      "Command palette (Ctrl+K)",
      "Dark theme",
      "Export to CSV",
      "Website blocking during focus"
    ],
    icon: <Zap className="w-6 h-6" />,
    gradient: "from-gray-600 to-gray-800",
    buttonText: "Get Started Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    period: "month",
    description: "Advanced features for serious productivity enthusiasts",
    features: [
      "Everything in Free",
      "Advanced analytics & reporting",
      "Notion integration & sync",
      "Calendar integration",
      "Team collaboration features",
      "Priority email support",
      "Custom themes and colors",
      "Advanced automation rules",
      "Time tracking insights",
      "Goal setting and tracking"
    ],
    icon: <Crown className="w-6 h-6" />,
    gradient: "from-[#E50914] to-[#FFD400]",
    buttonText: "Coming Soon",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 29,
    period: "month",
    description: "For teams and organizations that need advanced controls",
    features: [
      "Everything in Pro",
      "Admin dashboard & controls",
      "User management & permissions",
      "Advanced team analytics",
      "Custom integrations via API",
      "Single sign-on (SSO)",
      "Priority phone support",
      "Custom onboarding",
      "Data export & backup",
      "Service level agreement (SLA)"
    ],
    icon: <Star className="w-6 h-6" />,
    gradient: "from-purple-600 to-blue-600",
    buttonText: "Contact Sales",
    popular: false,
  },
];

interface PricingPlansProps {
  className?: string;
}

export default function PricingPlans({ className = "" }: PricingPlansProps) {
  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      try {
        window.location.href = "/auth/register";
      } catch (error) {
        console.error("Navigation error:", error);
      }
      return;
    }

    if (planId === "enterprise") {
      try {
        const subject = encodeURIComponent("Enterprise Plan Inquiry - FocusFlow");
        const body = encodeURIComponent("Hi, I'm interested in learning more about the Enterprise plan.\n\nName:\nCompany:\nTeam Size:\n\nPlease contact me to discuss pricing and features.");
        const mailtoLink = `mailto:sales@focusflow.app?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
      } catch (error) {
        console.error("Email link error:", error);
        alert("Please contact us at sales@focusflow.app");
      }
      return;
    }

    // Pro plan - coming soon, no errors
    if (planId === "pro") {
      alert("Pro plan is coming soon! Sign up for free and we'll notify you when it launches.");
      try {
        window.location.href = "/auth/register";
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative group ${
              plan.popular
                ? "ring-2 ring-[#E50914] ring-offset-2 ring-offset-black"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black text-sm font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
            )}
            
            <div className="h-full bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300 group-hover:scale-[1.02]">
              {/* Header */}
              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 text-black`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price}`}</span>
                  {plan.price > 0 && <span className="text-gray-400">/{plan.period}</span>}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black hover:shadow-lg hover:shadow-[#E50914]/50"
                    : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {plan.buttonText}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="text-left">
            <h4 className="font-medium mb-2">Is FocusFlow really free?</h4>
            <p className="text-gray-400 text-sm">
              Yes! The Free Forever plan includes all core features with no time limits or credit card required.
            </p>
          </div>
          <div className="text-left">
            <h4 className="font-medium mb-2">When will Pro features be available?</h4>
            <p className="text-gray-400 text-sm">
              Pro features are coming soon! Sign up for free and we'll notify you when they launch.
            </p>
          </div>
          <div className="text-left">
            <h4 className="font-medium mb-2">Can I use FocusFlow for my team?</h4>
            <p className="text-gray-400 text-sm">
              Team and enterprise features are in development. Contact sales@focusflow.app for early access.
            </p>
          </div>
          <div className="text-left">
            <h4 className="font-medium mb-2">What makes FocusFlow different?</h4>
            <p className="text-gray-400 text-sm">
              Beautiful design, powerful features, and completely free core functionality. No hidden fees or paywalls for essential features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
