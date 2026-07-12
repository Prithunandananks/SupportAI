import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import type { AnalyticsData } from "@/services/admin.service";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    return <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[400px] animate-pulse"></div>;
  }

  const chartData = data.days.map((day, i) => ({
    name: day,
    Conversations: data.conversations[i],
    Uploads: data.uploads[i],
  }));

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[400px] flex flex-col">
      <h2 className="text-xl font-semibold mb-6">
        Activity Overview
      </h2>

      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area type="monotone" dataKey="Conversations" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
            <Area type="monotone" dataKey="Uploads" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ActivityChart;