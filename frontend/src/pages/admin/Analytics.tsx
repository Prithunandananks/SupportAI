import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AnalyticsCards from "@/components/admin/analytics/AnalyticsCards";
import ActivityChart from "@/components/admin/analytics/ActivityChart";
import TopTopics from "@/components/admin/analytics/TopTopics";

import type { AnalyticsRange } from "./mockAnalyticsData";
import { mockAnalyticsData } from "./mockAnalyticsData";

function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Analytics refreshed successfully.");
    }, 1500);
  };

  const data = mockAnalyticsData[range];

  return (
    <AdminLayout title="Analytics">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold hidden md:block">Analytics Overview</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto ml-auto">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRange)}
            className="flex-1 md:flex-none bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`md:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className={`space-y-6 md:space-y-8 transition-opacity duration-300 ${isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <AnalyticsCards kpis={data.kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <ActivityChart chartData={data.chartData} />
          <TopTopics topics={data.topTopics} />
        </div>
      </div>
    </AdminLayout>
  );
}

export default Analytics;