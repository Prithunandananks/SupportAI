import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCore";

import Landing from "../pages/public/Landing";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ForgotPassword from "../pages/public/ForgotPassword";
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
import AdminSettings from "../pages/admin/Settings";
import NotFound from "../pages/shared/NotFound";

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

      <Route path="/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
      <Route path="/chat" element={<CustomerRoute><CustomerChat /></CustomerRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/documents" element={<AdminRoute><Documents /></AdminRoute>} />
      <Route path="/admin/flagged" element={<AdminRoute><FlaggedQuestions /></AdminRoute>} />
      <Route path="/admin/conversations" element={<AdminRoute><Conversations /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
      <Route path="/profile" element={<CustomerRoute><CustomerProfile /></CustomerRoute>} />

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
          element={<AdminRoute><AdminSettings /></AdminRoute>}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
