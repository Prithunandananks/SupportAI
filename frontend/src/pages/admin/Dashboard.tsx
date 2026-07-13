import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import SystemStatus from "@/components/admin/dashboard/SystemStatus";
import { adminService, type AdminActivity } from "@/services/admin.service";

function Dashboard() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  
  useEffect(() => {
    adminService.getRecentActivity(5)
      .then(setActivities)
      .catch(console.error);
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <DashboardStats />
      
      <SystemStatus />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="
          bg-slate-900
          rounded-xl
          md:rounded-2xl
          border
          border-slate-800
          p-4
          md:p-6
          ">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-5">
            Recent Activity
          </h2>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-slate-400 text-sm md:text-base py-4 text-center">
                No recent activity
              </div>
            ) : (
              activities.map(activity => {
                let colorClass = "border-slate-500";
                if (activity.type.includes("Document")) colorClass = "border-cyan-500";
                else if (activity.type.includes("flagged")) colorClass = "border-yellow-500";
                else if (activity.type.includes("answered")) colorClass = "border-green-500";
                
                return (
                  <div key={activity.id} className={`border-l-4 ${colorClass} pl-4`}>
                    <p className="font-medium text-sm md:text-base">
                      {activity.type}: {activity.description}
                    </p>
                    <span className="text-slate-400 text-xs md:text-sm">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="
          bg-slate-900
          rounded-xl
          md:rounded-2xl
          border
          border-slate-800
          p-4
          md:p-6
          ">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-5">
            Quick Actions
          </h2>

          <div className="grid gap-4">
            <button
              onClick={() => navigate("/admin/documents")}
              className="
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-2.5
              md:py-3
              text-sm
              md:text-base
              transition
              "
            >
              Upload New Document
            </button>

            <button
              onClick={() => navigate("/admin/flagged")}
              className="
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-2.5
              md:py-3
              text-sm
              md:text-base
              transition
              "
            >
              Review Flagged Questions
            </button>

            <button
              onClick={() => navigate("/admin/analytics")}
              className="
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-2.5
              md:py-3
              text-sm
              md:text-base
              transition
              "
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