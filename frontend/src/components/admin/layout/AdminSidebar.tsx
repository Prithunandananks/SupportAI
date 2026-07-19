import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  TriangleAlert,
  BarChart3,
  LogOut,
  ShieldAlert,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import LogoutConfirmationModal from "@/components/shared/LogoutConfirmationModal";
import { useAuth } from "@/hooks/useAuthCore";
function AdminSidebar({
  isOpen,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-cyan-500/15 border border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10"
        : "border-transparent text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white"
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:sticky
          top-0 left-0
          z-40
          h-screen
          lg:top-0
          w-72
          bg-slate-900
          border-r
          border-slate-800
          flex
          flex-col
          shadow-2xl
          transition-transform
          duration-300
          ease-in-out
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

      <div className="flex items-center justify-between p-6">

  <NavLink
    to="/"
    className="
      text-3xl
      font-bold
      text-cyan-400
      hover:text-cyan-300
      transition-colors
      duration-300
    "
  >
    SupportAI
  </NavLink>

  <button
    onClick={onClose}
    className="
      lg:hidden
      h-9
      w-9
      rounded-lg
      flex
      items-center
      justify-center
      text-slate-400
      hover:bg-slate-800
      hover:text-white
      transition
    "
  >
    ✕
  </button>

</div>

      <nav className="flex flex-col gap-2 px-4">

        <NavLink
          to="/admin/dashboard"
          className={menuClass}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/documents"
          className={menuClass}
        >
          <FileText size={20} />
          Knowledge Base
        </NavLink>

        <NavLink
          to="/admin/conversations"
          className={menuClass}
        >
          <MessagesSquare size={20} />
          Conversations
        </NavLink>

        <NavLink
          to="/admin/flagged"
          className={menuClass}
        >
          <TriangleAlert size={20} />
          Flagged Questions
        </NavLink>

        <NavLink
          to="/admin/quality"
          className={menuClass}
        >
          <ShieldAlert size={20} />
          AI Quality Center
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={menuClass}
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

        <NavLink
          to="/admin/organization"
          className={menuClass}
        >
          <ShieldAlert size={20} />
          Organization
        </NavLink>

      </nav>

      <button 
        onClick={() => setIsLogoutModalOpen(true)}
        className="
        mt-auto
        m-5
        flex
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-red-500/90
        py-3
        transition-all
        duration-300
        hover:bg-red-600
        hover:shadow-lg
        hover:shadow-red-500/20
        " 
      >
        <LogOut size={18} />
        Logout
      </button>

    </aside>

    <LogoutConfirmationModal
      isOpen={isLogoutModalOpen}
      onClose={() => setIsLogoutModalOpen(false)}
      onConfirm={() => {
        logout();
        navigate("/", { replace: true, state: {} });
        setIsLogoutModalOpen(false);
      }}
    />

    </>
  );
}

export default AdminSidebar;
