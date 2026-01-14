import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router";
import { 
  Play, TrendingUp, Target, Zap, Timer, CheckCircle2, BarChart3, Calendar, 
  Clock, ListTodo, Settings, Sparkles, Command, Brain, Repeat, 
  Shield, Layers, Users, Lightbulb, ChevronDown, ChevronUp, DollarSign, Crown
} from "lucide-react";
import EmailSignupForm from "@/react-app/components/EmailSignupForm";
import PricingPlans from "@/react-app/components/PricingPlans";

export default function Home() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [specialPlan, setSpecialPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check for special plan parameter in URL
    const plan = searchParams.get('plan');
    if (plan && ["pro", "enterprise"].includes(plan)) {
      setSpecialPlan(plan);
    }

    // Check for registration code parameter
    const code = searchParams.get('code');
    if (code && !plan) {
      // Validate the code to get the plan
      fetch(`/api/registration-codes/${code}/validate`)
        .then(res => res.json())
        .then(data => {
          if (data.valid && data.plan_id) {
            setSpecialPlan(data.plan_id);
          }
        })
        .catch(err => console.error("Failed to validate registration code:", err));
    }
  }, [searchParams]);

  const handleSignUp = async () => {
    try {
      // Check for registration code in URL
      const registrationCode = searchParams.get('code');
      
      // Construct API URL with plan parameter if present
      let endpoint = "api/oauth/google/redirect_url";
      if (specialPlan && ["pro", "enterprise"].includes(specialPlan)) {
        endpoint += `?plan=${specialPlan}`;
      }
      
      const { apiFetch } = await import('@/react-app/utils/api');
      const response = await apiFetch(endpoint);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get OAuth URL');
      }
      
      const data = await response.json();
      
      // Store registration code in sessionStorage to pass through OAuth flow
      if (registrationCode) {
        sessionStorage.setItem('registration_code', registrationCode);
      }
      
      window.location.href = data.redirectUrl;
    } catch (error) {
      console.error("Failed to initiate Google sign-in:", error);
      alert("Failed to start sign-in. Please make sure the backend server is running on port 3000.");
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 via-black to-[#FFD400]/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(229, 9, 20, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 212, 0, 0.15) 0%, transparent 50%)"
        }}></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#E50914] rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#FFD400] rounded-full animate-pulse delay-75"></div>
          <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-[#E50914] rounded-full animate-pulse delay-150"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24">
          {/* Special Plan Banner */}
          {specialPlan && (
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className={`px-6 py-3 rounded-full border-2 ${
                specialPlan === 'enterprise' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500 shadow-lg shadow-purple-500/50'
                  : 'bg-gradient-to-r from-[#E50914] to-[#FFD400] border-[#FFD400] shadow-lg shadow-[#E50914]/50'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {specialPlan === 'enterprise' ? (
                    <>
                      <Crown className="w-5 h-5 text-white" />
                      <span className="text-white">
                        Special Enterprise Access - Sign up to claim your ENTERPRISE plan!
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-black" />
                      <span className="text-black">
                        Special Pro Access - Sign up to claim your PRO plan!
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Header with Logo and Sign Up Button */}
          <div className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center shadow-lg shadow-[#E50914]/50">
                <Zap className="w-6 h-6 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
                FocusFlow
              </span>
            </div>
            <button
              onClick={handleSignUp}
              className="px-6 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg font-semibold text-black hover:shadow-lg hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105"
            >
              Sign Up
            </button>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 border border-[#E50914]/30 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-[#FFD400]" />
              <span className="text-sm text-gray-300">Your productivity command center</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Enter Your
              <br />
              <span className="bg-gradient-to-r from-[#E50914] via-red-400 to-[#FFD400] bg-clip-text text-transparent">
                Flow State.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              FocusFlow is the ultimate productivity companion designed for ambitious professionals. Seamlessly manage tasks, focus with intention, and track your progress—all while staying in your flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleSignUp}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-lg text-black hover:shadow-2xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {specialPlan ? `Get Started with ${specialPlan.toUpperCase()}` : 'Get Started Free'}
                  <Play className="w-5 h-5" />
                </span>
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gray-900 border border-gray-800 rounded-xl font-semibold text-lg text-white hover:bg-gray-800 hover:border-gray-700 transition-all duration-300"
              >
                Learn More
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
              <StatItem number="25min" label="Default Focus Sessions" />
              <StatItem number="10+" label="Core Features" />
              <StatItem number="100%" label="Free Forever" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Stay in Flow</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built for ambitious individuals who want to achieve more while maintaining perfect focus and clarity.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={<ListTodo className="w-7 h-7" />}
            title="Smart Task Management"
            description="Create, organize, and prioritize tasks with intelligent parsing. Add projects, tags, due dates, and time estimates in natural language."
            gradient="from-[#E50914]/20 to-[#E50914]/5"
          />
          <FeatureCard
            icon={<Timer className="w-7 h-7" />}
            title="Pomodoro Timer"
            description="Stay focused with customizable work/break intervals. Auto-start sessions, keyboard shortcuts, and minimal distraction mode."
            gradient="from-[#FFD400]/20 to-[#FFD400]/5"
          />
          <FeatureCard
            icon={<BarChart3 className="w-7 h-7" />}
            title="Visual Analytics"
            description="Track your productivity patterns with beautiful charts. See time spent, completion rates, and focus session insights."
            gradient="from-[#E50914]/20 to-[#FFD400]/5"
          />
          <FeatureCard
            icon={<Command className="w-7 h-7" />}
            title="Command Palette"
            description="Lightning-fast navigation with Ctrl+K. Quickly access any feature, start focus sessions, or add tasks without clicking."
            gradient="from-[#FFD400]/20 to-[#E50914]/5"
          />
          <FeatureCard
            icon={<Calendar className="w-7 h-7" />}
            title="Weekly Planner"
            description="Visualize your week at a glance. Organize tasks by day, track progress, and maintain perfect scheduling balance."
            gradient="from-[#E50914]/15 to-[#FFD400]/15"
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-7 h-7" />}
            title="Subtask Breakdown"
            description="Break complex tasks into manageable pieces. Track progress on each component and estimate time accurately."
            gradient="from-[#FFD400]/15 to-[#E50914]/15"
          />
        </div>

        {/* Advanced Features */}
        <div className="bg-gradient-to-br from-[#E50914]/5 via-black to-[#FFD400]/5 border border-gray-800 rounded-3xl p-8 mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">Advanced Features</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdvancedFeature
              icon={<Brain className="w-6 h-6" />}
              title="Smart Parsing"
              description="Type naturally and let AI extract project, priority, due date, and tags automatically."
            />
            <AdvancedFeature
              icon={<Shield className="w-6 h-6" />}
              title="Focus Guard"
              description="Track distracting website visits and get instant alerts to stay focused during work sessions."
            />
            <AdvancedFeature
              icon={<Repeat className="w-6 h-6" />}
              title="Recurring Tasks"
              description="Set up daily, weekly, or custom recurring tasks that auto-create on schedule."
            />
            <AdvancedFeature
              icon={<Layers className="w-6 h-6" />}
              title="Project Organization"
              description="Group tasks by projects, filter views, and track progress across different initiatives."
            />
            <AdvancedFeature
              icon={<Lightbulb className="w-6 h-6" />}
              title="Motivational Prompts"
              description="Get encouraging messages and productivity tips during breaks and focus sessions."
            />
            <AdvancedFeature
              icon={<Users className="w-6 h-6" />}
              title="Profile Management"
              description="Customize your workspace with personal settings, themes, and productivity preferences."
            />
            <AdvancedFeature
              icon={<Settings className="w-6 h-6" />}
              title="Customizable Settings"
              description="Fine-tune focus durations, break intervals, notifications, and workflow preferences."
            />
            <AdvancedFeature
              icon={<Clock className="w-6 h-6" />}
              title="Time Tracking"
              description="Automatically track time spent on tasks and compare with your estimates for better planning."
            />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Three simple steps to transform your productivity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Create Your Tasks"
            description="Quickly add tasks with smart parsing. Type naturally like 'Marketing campaign #urgent due tomorrow' and we handle the rest."
            icon={<Target className="w-10 h-10" />}
          />
          <StepCard
            number="2"
            title="Focus with Timer"
            description="Start a Pomodoro session for any task. Work in focused 25-minute sprints with automatic break reminders."
            icon={<Clock className="w-10 h-10" />}
          />
          <StepCard
            number="3"
            title="Track Progress"
            description="Review your productivity analytics. See what's working, identify patterns, and optimize your workflow."
            icon={<TrendingUp className="w-10 h-10" />}
          />
        </div>
      </div>

      {/* Features Highlight */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-[#E50914]/10 via-black to-[#FFD400]/10 border border-gray-800 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5"></div>
          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Designed for
                <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Deep Work</span>
              </h3>
              <ul className="space-y-4">
                <FeatureListItem text="Keyboard shortcuts for lightning-fast navigation (Ctrl+K)" />
                <FeatureListItem text="Minimal mode to eliminate distractions completely" />
                <FeatureListItem text="Focus Guard alerts for distraction awareness" />
                <FeatureListItem text="Motivational prompts to maintain momentum" />
                <FeatureListItem text="Dark theme optimized for long work sessions" />
                <FeatureListItem text="Time tracking for accurate future estimates" />
                <FeatureListItem text="Weekly planning view for strategic organization" />
                <FeatureListItem text="Smart task parsing with natural language" />
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-gray-500">FocusFlow</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 border border-[#E50914]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Current Task</span>
                      <span className="text-xs text-[#FFD400]">In Progress</span>
                    </div>
                    <p className="text-xs text-gray-400">Complete landing page design</p>
                  </div>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent mb-2">
                      18:42
                    </div>
                    <p className="text-xs text-gray-500">Focus Session Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Signup Section */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join the
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Waitlist</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Be the first to access premium features, integrations, and exclusive productivity insights.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <EmailSignupForm source="home-waitlist" />
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Early Access to Pro Features</h4>
                <p className="text-gray-400 text-sm">Get premium features before anyone else, including advanced analytics and team collaboration.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-4 h-4 text-black" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Exclusive Community</h4>
                <p className="text-gray-400 text-sm">Join a community of productivity enthusiasts and get tips from experts.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <DollarSign className="w-4 h-4 text-black" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Special Launch Pricing</h4>
                <p className="text-gray-400 text-sm">Get exclusive discounts on premium plans when they launch.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Pricing</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start free forever. Upgrade when you need advanced features for teams and integrations.
          </p>
        </div>
        
        <PricingPlans />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked
            <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Questions</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about FocusFlow
          </p>
        </div>

        <div className="space-y-4">
          <FAQItem
            question="Is FocusFlow really free forever?"
            answer="Yes! FocusFlow is completely free with no limits on tasks, projects, or focus sessions. We believe everyone deserves access to great productivity tools."
          />
          <FAQItem
            question="What makes FocusFlow different from other productivity apps?"
            answer="FocusFlow combines smart task management, Pomodoro timing, and analytics in one beautiful interface. Our command palette (Ctrl+K) and natural language parsing make it incredibly fast to use, while the weekly planner helps you stay organized."
          />
          <FAQItem
            question="How does the smart task parsing work?"
            answer="Just type naturally! For example, 'Review marketing proposal #urgent due Friday' automatically creates a task with 'urgent' priority and Friday due date. The AI extracts projects, tags, dates, and priorities from your natural language."
          />
          <FAQItem
            question="Can I customize the Pomodoro timer settings?"
            answer="Absolutely! You can adjust focus session length (default 25 min), short breaks (5 min), long breaks (15 min), and how many cycles before a long break. Enable auto-start for seamless sessions."
          />
          <FAQItem
            question="Does FocusFlow work offline?"
            answer="FocusFlow works best online for syncing across devices, but basic functionality like timer and local task management works offline. Your data syncs when you reconnect."
          />
          <FAQItem
            question="How does the Focus Guard feature work?"
            answer="During focus sessions, FocusFlow tracks when you visit distracting websites and shows immediate alerts to bring your attention back. You can specify sites to monitor in settings. It also records distraction analytics to help you understand your focus patterns and improve over time."
          />
          <FAQItem
            question="Can I organize tasks into projects?"
            answer="Yes! Add projects to tasks using hashtags (#marketing) or through the task creation form. Filter by project in the tasks view and track progress across different initiatives."
          />
          <FAQItem
            question="What analytics does FocusFlow provide?"
            answer="Track time spent on tasks, focus session completion rates, productivity patterns, and compare estimated vs actual time. The analytics help you understand your work patterns and improve estimates."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to
          <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent"> Enter </span>
          Your Flow State?
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of professionals who've discovered their optimal productivity flow. Start your journey in seconds—no credit card required.
        </p>
        <button
          onClick={handleSignUp}
          className="group relative px-10 py-5 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-xl text-black hover:shadow-2xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105"
        >
          <span className="relative z-10 flex items-center gap-2">
            {specialPlan ? `Start with ${specialPlan.toUpperCase()} Access` : 'Start Focusing Now'}
            <Play className="w-6 h-6" />
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-900 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
                FocusFlow
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-400 text-xs transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <span className="text-gray-700">•</span>
                <a 
                  href="/terms-of-service" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-400 text-xs transition-colors duration-200"
                >
                  Terms of Service
                </a>
              </div>
              <p className="text-gray-500 text-sm">
                Built for makers who ship. © 2025 FocusFlow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-xs md:text-sm text-gray-500">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl ${gradient}`}></div>
      <div className={`relative bg-gradient-to-br ${gradient} backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 h-full`}>
        <div className="w-12 h-12 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-xl flex items-center justify-center mb-4 text-[#E50914] group-hover:text-[#FFD400] transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function AdvancedFeature({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group text-center">
      <div className="w-12 h-12 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-xl flex items-center justify-center mb-3 mx-auto text-[#E50914] group-hover:text-[#FFD400] transition-colors duration-300">
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative text-center">
      <div className="mb-6 relative inline-block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-2xl blur-lg opacity-50"></div>
        <div className="relative w-20 h-20 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-2xl flex items-center justify-center text-black">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-[#FFD400] rounded-full flex items-center justify-center text-sm font-bold text-[#FFD400]">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureListItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#E50914] to-[#FFD400] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />
      </div>
      <span className="text-gray-300">{text}</span>
    </li>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-900/30 transition-colors duration-200"
      >
        <span className="font-semibold">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#FFD400]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#E50914]" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
