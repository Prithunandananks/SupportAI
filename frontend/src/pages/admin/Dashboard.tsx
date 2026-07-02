import { useNavigate } from "react-router-dom";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Dashboard">
      <DashboardStats />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold mb-5">
            Recent Activity
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-cyan-500 pl-4">
              <p className="font-medium">
                Employee Handbook uploaded
              </p>
              <span className="text-slate-400 text-sm">
                10 minutes ago
              </span>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="font-medium">
                Low confidence response flagged
              </p>
              <span className="text-slate-400 text-sm">
                22 minutes ago
              </span>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-medium">
                Admin answered a flagged question
              </p>
              <span className="text-slate-400 text-sm">
                1 hour ago
              </span>
            </div>
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
              className="bg-cyan-500 hover:bg-cyan-600 rounded-xl py-3 transition"
            >
              Upload New Document
            </button>

            <button
              onClick={() => navigate("/admin/flagged")}
              className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 transition"
            >
              Review Flagged Questions
            </button>

            <button
              onClick={() => navigate("/admin/analytics")}
              className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 transition"
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