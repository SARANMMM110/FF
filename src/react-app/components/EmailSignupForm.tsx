import { useState } from "react";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/react-app/utils/api";

interface EmailSignupFormProps {
  source?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function EmailSignupForm({ source = "website", onSuccess, className = "" }: EmailSignupFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setStatus("idle");

    try {
      const response = await apiFetch("api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          signup_source: source,
          marketing_consent: true,
          utm_source: new URLSearchParams(window.location.search).get("utm_source"),
          utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
          utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
          referrer: document.referrer,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Thanks! You're now on our early access list.");
        setEmail("");
        setName("");
        onSuccess?.();
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className={`bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">You're In!</h3>
        <p className="text-gray-300">{message}</p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 border border-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-lg flex items-center justify-center">
          <Mail className="w-4 h-4 text-black" />
        </div>
        <h3 className="text-lg font-semibold">Get Early Access</h3>
      </div>
      
      <p className="text-gray-400 text-sm mb-6">
        Join the waitlist and be the first to know when we launch premium features and integrations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all duration-200"
          />
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all duration-200"
          />
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full group relative px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg font-semibold text-black hover:shadow-lg hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Signing Up...
              </>
            ) : (
              <>
                Join Waitlist
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </span>
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center">
        By signing up, you agree to receive product updates and marketing emails. Unsubscribe anytime.
      </p>
    </div>
  );
}
