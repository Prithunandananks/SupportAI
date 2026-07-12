import { useState, type ReactNode } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface Props {
  title: string;
  children: ReactNode;
}

function AdminLayout({
  title,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      <AdminSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col lg:px-2 ">

        <AdminHeader title={title}  onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-3 sm:p-4 md:p-8">

          {children}

        </div>

      </main>

    </div>
  );
}

export default AdminLayout;