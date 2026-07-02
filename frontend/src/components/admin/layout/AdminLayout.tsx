import type { ReactNode } from "react";

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
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      <AdminSidebar />

      <main className="flex-1 flex flex-col">

        <AdminHeader title={title} />

        <div className="p-8">

          {children}

        </div>

      </main>

    </div>
  );
}

export default AdminLayout;