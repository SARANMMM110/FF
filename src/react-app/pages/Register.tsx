import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { Loader2, Zap } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { redirectToLogin, user, isPending } = useAuth();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleSignUp = async () => {
    try {
      await redirectToLogin();
    } catch (error) {
      console.error("Sign up error:", error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center shadow-lg shadow-[#E50914]/50">
            <Zap className="w-7 h-7 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
            FocusFlow
          </span>
        </div>

        {/* Register Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-400">Join FocusFlow and start being productive</p>
          </div>

          <button
            onClick={handleGoogleSignUp}
            className="w-full py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-black hover:shadow-xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link 
                to="/auth/login" 
                className="text-[#E50914] hover:text-[#FFD400] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-xl text-center">
            <p className="text-xs text-blue-300">
              <strong>Secure Sign-Up:</strong> Your data is encrypted and protected.
              We'll never share your information.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
