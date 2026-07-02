import {
  MessageCircle,
  FileText,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";

import StatCard from "./StatCard";

function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <StatCard
        title="Total Conversations"
        value="154"
        icon={<MessageCircle size={34} />}
      />

      <StatCard
        title="Documents Uploaded"
        value="24"
        icon={<FileText size={34} />}
      />

      <StatCard
        title="Flagged Questions"
        value="8"
        icon={<AlertTriangle size={34} />}
      />

      <StatCard
        title="Average Confidence"
        value="94%"
        icon={<BadgeCheck size={34} />}
      />

    </div>
  );
}

export default DashboardStats;