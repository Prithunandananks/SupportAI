import {
  MessageCircle,
  FileText,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";

import StatCard from "./StatCard";

function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

      <StatCard
        title="Total Conversations"
        value="154"
        icon={<MessageCircle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Documents Uploaded"
        value="24"
        icon={<FileText className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Flagged Questions"
        value="8"
        icon={<AlertTriangle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Average Confidence"
        value="94%"
        icon={<BadgeCheck className="w-7 h-7 md:w-9 md:h-9" />}
      />

    </div>
  );
}

export default DashboardStats;