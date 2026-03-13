import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { ProfileProvider } from "@/react-app/contexts/ProfileContext";
import { GlobalTimerProvider } from "@/react-app/contexts/GlobalTimerContext";
import ErrorBoundary from "@/react-app/components/ErrorBoundary";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";

// e.g. /dashboard when app is served at mortalfocus.com/dashboard (set via VITE_BASE_PATH at build time)
const basename = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <ThemeProvider>
            <ProfileProvider>
              <GlobalTimerProvider>
                <App />
              </GlobalTimerProvider>
            </ProfileProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
