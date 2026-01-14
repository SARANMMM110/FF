import { useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract state parameter (which contains special plan if present)
        const state = searchParams.get('state');
        
        // Get the auth code
        const code = searchParams.get('code');
        
        // Check for registration code stored in sessionStorage
        const registrationCode = sessionStorage.getItem('registration_code');
        if (registrationCode) {
          sessionStorage.removeItem('registration_code'); // Clean up
        }
        
        if (code) {
          // Create session with state parameter and registration code
          const { apiFetch } = await import('@/react-app/utils/api');
          const response = await apiFetch('api/sessions', {
            method: "POST",
            body: JSON.stringify({ 
              code,
              state: state || undefined,
              registration_code: registrationCode || undefined
            }),
          });

          if (response.ok) {
            // Force a page reload to refresh auth state
            window.location.href = "/dashboard";
          } else {
            // Get error details from response
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("Session creation failed:", errorData);
            throw new Error(errorData.message || errorData.error || "Session creation failed");
          }
        } else {
          // No code in URL, check if we have one from query params
          const urlCode = searchParams.get('code');
          if (urlCode) {
            await exchangeCodeForSessionToken(urlCode);
            navigate("/dashboard");
          } else {
            throw new Error("No authorization code found");
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/");
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-spin mb-4">
        <Loader2 className="w-12 h-12 text-red-500" />
      </div>
      <p className="text-gray-400">Completing sign in...</p>
    </div>
  );
}
