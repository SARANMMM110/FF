import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/react-app/utils/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (oauthError) {
      navigate(`/?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code) {
      navigate("/");
      return;
    }

    // Google codes are single-use. React Strict Mode runs effects twice in dev; dedupe with sessionStorage.
    const lockKey = `ff_oauth_exchange:${code}`;
    if (sessionStorage.getItem(lockKey)) {
      return;
    }
    sessionStorage.setItem(lockKey, "1");

    void (async () => {
      try {
        const registrationCode = sessionStorage.getItem("registration_code");
        if (registrationCode) {
          sessionStorage.removeItem("registration_code");
        }

        const response = await apiFetch("api/sessions", {
          method: "POST",
          body: JSON.stringify({
            code,
            state: state || undefined,
            registration_code: registrationCode || undefined,
          }),
        });

        if (response.ok) {
          window.location.href = "/dashboard";
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("Session creation failed:", errorData);
          sessionStorage.removeItem(lockKey);
          throw new Error(errorData.message || errorData.error || "Session creation failed");
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/");
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-spin mb-4">
        <Loader2 className="w-12 h-12 text-red-500" />
      </div>
      <p className="text-gray-400">Completing sign in...</p>
    </div>
  );
}
