import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  TriangleAlert,
  BarChart3,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

function AdminSidebar() {
  const menuClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">

      <h1 className="text-3xl font-bold text-cyan-400 p-6">
        SupportAI
      </h1>

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
          to="/admin/analytics"
          className={menuClass}
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

      </nav>

      <button className="mt-auto m-5 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 transition hover:bg-red-600">
        <LogOut size={18} />
        Logout
      </button>

    </aside>
  );
}

export default AdminSidebar;