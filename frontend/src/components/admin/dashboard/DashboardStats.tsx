import { useEffect, useState } from "react";
import {
  MessageCircle,
  FileText,
  BadgeCheck,
} from "lucide-react";

import StatCard from "./StatCard";
import { adminService } from "@/services/admin.service";
import type { DashboardStats as DashboardStatsData } from "@/services/admin.service";

function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getStats()
      .then(setStats)
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setError("Failed to load statistics.");
      });
  }, []);

  if (error) {
    return <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[120px]"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <StatCard
        title="Total Conversations"
        value={stats.total_conversations.toString()}
        icon={<MessageCircle size={34} />}
      />

      <StatCard
        title="Documents Uploaded"
        value={stats.total_documents.toString()}
        icon={<FileText size={34} />}
      />

      <StatCard
        title="Active Users"
        value={stats.active_users.toString()}
        icon={<BadgeCheck size={34} />}
      />

      <StatCard
        title="AI Responses"
        value={stats.total_ai_messages.toString()}
        icon={<MessageCircle size={34} />}
      />

    </div>
  );
}

export default DashboardStats;