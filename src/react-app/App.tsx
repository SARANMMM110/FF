import { Routes, Route, Navigate } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import LoginPage from "@/react-app/pages/Login";
import RegisterPage from "@/react-app/pages/Register";
import DashboardPage from "@/react-app/pages/Dashboard";
import FocusPage from "@/react-app/pages/Focus";
import TasksPage from "@/react-app/pages/Tasks";
import AnalyticsPage from "@/react-app/pages/Analytics";
import SettingsPage from "@/react-app/pages/Settings";
import ProfilePage from "@/react-app/pages/Profile";
import AdminLoginPage from "@/react-app/pages/AdminLogin";
import AdminDashboardPage from "@/react-app/pages/AdminDashboard";
import AdminRegistrationCodesPage from "@/react-app/pages/AdminRegistrationCodes";
import WeeklyPlannerPage from "@/react-app/pages/WeeklyPlanner";
import PricingPage from "@/react-app/pages/Pricing";
import GoalsPage from "@/react-app/pages/Goals";
import AnalyticsTestPage from "@/react-app/pages/AnalyticsTest";
import FixUserDataPage from "@/react-app/pages/FixUserData";
import PrivacyPolicyPage from "@/react-app/pages/PrivacyPolicy";
import TermsOfServicePage from "@/react-app/pages/TermsOfService";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthCallbackPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/focus-mode" element={<FocusPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/planner" element={<WeeklyPlannerPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/analytics-test" element={<AnalyticsTestPage />} />
      <Route path="/fix-user-data" element={<FixUserDataPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/registration-codes" element={<AdminRegistrationCodesPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      {/* Catch-all route for undefined paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
