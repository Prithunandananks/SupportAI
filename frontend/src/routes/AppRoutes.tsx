import { Routes, Route } from "react-router-dom";

import Landing from "../pages/public/Landing";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import FlaggedQuestions from "../pages/admin/FlaggedQuestions";
import CustomerChat from "../pages/customer/CustomerChat";
import Conversations from "../pages/admin/Conversations";
import Dashboard from "../pages/admin/Dashboard";
import Documents from "../pages/admin/Documents";
import Analytics from "../pages/admin/Analytics";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/chat" element={<CustomerChat />} />

      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/documents" element={<Documents />} />
      <Route path="/admin/flagged" element={<FlaggedQuestions />} />
      <Route path="/admin/conversations" element={<Conversations />} />
      <Route path="/admin/analytics" element={<Analytics />} />
    </Routes>
  );
}

export default AppRoutes;