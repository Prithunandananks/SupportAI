import AdminLayout from "@/components/admin/layout/AdminLayout";

import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import ActivityChart from "@/components/admin/analytics/ActivityChart";
import TopTopics from "@/components/admin/analytics/TopTopics";

function Analytics() {
  return (
    <AdminLayout title="Analytics">
      <div className="space-y-8">
        <DashboardStats />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ActivityChart />

          <TopTopics />
        </div>
      </div>
    </AdminLayout>
  );
}

export default Analytics;