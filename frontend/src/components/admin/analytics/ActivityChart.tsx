import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import type { AnalyticsData } from "@/services/admin.service";

function ActivityChart() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getAnalytics()
      .then(setData)
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setError("Failed to load chart data.");
      });
  }, []);

  if (error) {
    return <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900">{error}</div>;
  }

  if (!data) {
    return <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[300px] animate-pulse"></div>;
  }

  // Calculate percentages based on max value for the bars
  const maxChats = Math.max(...data.conversations, 1); // Avoid div by 0

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Weekly Chat Activity
      </h2>

      <div className="flex items-end justify-between h-52 gap-3">
        {data.conversations.map((val, index) => {
          const height = Math.round((val / maxChats) * 100);
          return (
            <div
              key={index}
              className="flex-1 bg-cyan-500 rounded-t-xl hover:bg-cyan-400 transition relative group"
              style={{ height: `${height}%` }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition">
                {val}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-4 text-sm text-slate-400">
        {data.days.map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
    </div>
  );
}

export default ActivityChart;