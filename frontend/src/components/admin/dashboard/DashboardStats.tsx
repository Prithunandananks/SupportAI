import {
  MessageCircle,
  FileText,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { adminService, type DashboardStats as ApiStats } from "@/services/admin.service";

function DashboardStats() {
  const [stats, setStats] = useState<ApiStats | null>(null);

  useEffect(() => {
    adminService.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

      <StatCard
        title="Total Conversations"
        value={stats ? stats.total_conversations.toString() : "0"}
        icon={<MessageCircle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Documents Uploaded"
        value={stats ? stats.total_documents.toString() : "0"}
        icon={<FileText className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Open Reports"
        value={stats ? stats.open_reports.toString() : "0"}
        icon={<AlertTriangle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Positive Feedback"
        value={stats && stats.positive_feedback !== null ? `${stats.positive_feedback}%` : "No Data"}
        icon={<BadgeCheck className="w-7 h-7 md:w-9 md:h-9" />}
      />

    </div>
  );
}

export default DashboardStats;