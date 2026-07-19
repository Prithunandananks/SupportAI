import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCore";

import Landing from "../pages/public/Landing";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ForgotPassword from "../pages/public/ForgotPassword";
import ResetPassword from "../pages/public/ResetPassword";
import FlaggedQuestions from "../pages/admin/FlaggedQuestions";
import CustomerChat from "../pages/customer/CustomerChat";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import Conversations from "../pages/admin/Conversations";
import Dashboard from "../pages/admin/Dashboard";
import Documents from "../pages/admin/Documents";
import Analytics from "../pages/admin/Analytics";
import CustomerProfile from "../pages/customer/Profile";
import AdminProfile from "../pages/admin/Profile";
import CustomerSettings from "../pages/customer/Settings";
import NotFound from "../pages/shared/NotFound";


import Notifications from "@/pages/customer/Notifications";
import AdminTicketDetails from "../pages/admin/AdminTicketDetails";
import AIQuality from "../pages/admin/AIQuality";
import AdminDocumentDetails from "../pages/admin/AdminDocumentDetails";
import OrganizationSettings from "../pages/admin/OrganizationSettings";
import AuditLogs from "../pages/admin/AuditLogs";
import ApiKeys from "../pages/admin/ApiKeys";
import Webhooks from "../pages/admin/Webhooks";
import SecurityOverview from "../pages/admin/SecurityOverview";

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "customer" || user?.role === "Customer") return <>{children}</>;
  return <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "admin" || user?.role === "Admin") return <>{children}</>;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
      <Route path="/chat" element={<CustomerRoute><CustomerChat /></CustomerRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/documents" element={<AdminRoute><Documents /></AdminRoute>} />
      <Route path="/admin/flagged" element={<AdminRoute><FlaggedQuestions /></AdminRoute>} />
      <Route path="/admin/quality" element={<AdminRoute><AIQuality /></AdminRoute>} />
      <Route path="/admin/conversations" element={<AdminRoute><Conversations /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
      <Route path="/admin/organization" element={<AdminRoute><OrganizationSettings /></AdminRoute>} />
      <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
      <Route path="/admin/api-keys" element={<AdminRoute><ApiKeys /></AdminRoute>} />
      <Route path="/admin/webhooks" element={<AdminRoute><Webhooks /></AdminRoute>} />
      <Route path="/admin/security" element={<AdminRoute><SecurityOverview /></AdminRoute>} />
      <Route path="/admin/flagged/:id" element={<AdminRoute><AdminTicketDetails /></AdminRoute>} />
      <Route path="/admin/documents/:id" element={<AdminRoute><AdminDocumentDetails /></AdminRoute>} />
      <Route path="/profile" element={<CustomerRoute><CustomerProfile /></CustomerRoute>} />
      <Route path="/notifications" element={<CustomerRoute><Notifications /></CustomerRoute>} />

      <Route
          path="/admin/profile"
          element={<AdminRoute><AdminProfile /></AdminRoute>}
      />
      <Route
          path="/settings"
          element={<CustomerRoute><CustomerSettings /></CustomerRoute>}
      />
      <Route
          path="/admin/settings"
          element={<Navigate to="/admin/organization" replace />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
