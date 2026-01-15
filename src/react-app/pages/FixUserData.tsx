import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import Layout from "@/react-app/components/Layout";
import { useNavigate } from "react-router";
import { apiFetch } from "@/react-app/utils/api";

export default function FixUserData() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Checking...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setStatus("Not logged in");
      return;
    }

    const checkAndFixUser = async () => {
      try {
        setStatus("Checking database...");
        
        // Check current user info
        const meResponse = await apiFetch("api/users/me");
        const meData = await meResponse.json();
        setDetails(meData);
        
        // Try to create a test session to trigger user creation
        setStatus("Creating user record if needed...");
        const sessionResponse = await apiFetch("api/test/create-session", {
          method: "POST",
        });
        
        if (sessionResponse.ok) {
          setStatus("✅ User data fixed! You can now use the timer and see analytics.");
        } else {
          const error = await sessionResponse.text();
          setStatus(`❌ Error: ${error}`);
        }
      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    checkAndFixUser();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Fix User Data</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        {details && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold mb-4">Your User Info</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/focus-mode")}
            className="px-6 py-3 bg-[#E50914] text-white rounded-lg font-bold hover:bg-[#b8070f] transition-colors"
          >
            Go to Focus Mode
          </button>
          <button
            onClick={() => navigate("/analytics")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Go to Analytics
          </button>
        </div>
      </div>
    </Layout>
  );
}
