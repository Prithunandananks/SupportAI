import { useNavigate } from "react-router-dom";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import RecentActivityList from "@/components/admin/dashboard/RecentActivityList";
import SystemStatus from "@/components/admin/dashboard/SystemStatus";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Dashboard">
      <DashboardStats />
      
      <SystemStatus />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold mb-5">
            Recent Uploads
          </h2>

          <div className="space-y-4">
            <RecentActivityList />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold mb-5">
            Quick Actions
          </h2>

          <div className="grid gap-4">
            <button
              onClick={() => navigate("/admin/documents")}
              className="bg-cyan-500 hover:bg-cyan-600 rounded-xl py-3 transition font-medium"
            >
              Upload New Document
            </button>

            <button
              onClick={() => navigate("/admin/flagged")}
              className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 transition font-medium text-slate-300 hover:text-white"
            >
              Review Flagged Questions
            </button>

            <button
              onClick={() => navigate("/admin/analytics")}
              className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 transition font-medium text-slate-300 hover:text-white"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Dashboard;