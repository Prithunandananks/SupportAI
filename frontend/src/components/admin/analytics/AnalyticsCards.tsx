import {
  MessageCircle,
  BadgeCheck,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";

import StatCard from "../dashboard/StatCard";

function AnalyticsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <StatCard
        title="Chats Today"
        value="128"
        icon={<MessageCircle size={34} />}
      />

      <StatCard
        title="Avg Confidence"
        value="91%"
        icon={<BadgeCheck size={34} />}
      />

      <StatCard
        title="Positive Feedback"
        value="84%"
        icon={<ThumbsUp size={34} />}
      />

      <StatCard
        title="Flagged Questions"
        value="12"
        icon={<AlertTriangle size={34} />}
      />

    </div>
  );
}

export default AnalyticsCards;