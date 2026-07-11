import {
  MessageCircle,
  BadgeCheck,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";

import StatCard from "../dashboard/StatCard";
import type { KPIData } from "@/pages/admin/Analytics";

const iconMap: Record<string, React.ReactNode> = {
  Chats: <MessageCircle size={34} />,
  Confidence: <BadgeCheck size={34} />,
  Feedback: <ThumbsUp size={34} />,
  Flagged: <AlertTriangle size={34} />,
};

interface Props {
  kpis: KPIData[];
}

function AnalyticsCards({ kpis }: Props) {
  return (
    <div className="
      grid
      grid-cols-2
      xl:grid-cols-4
      gap-4
      md:gap-6
      "
    >
      {kpis.map((kpi, idx) => (
        <StatCard
          key={idx}
          title={kpi.title}
          value={kpi.value.toString()}
          icon={iconMap[kpi.iconKey]}
          trend={kpi.trend}
          trendLabel={kpi.trendLabel}
        />
      ))}
    </div>
  );
}

export default AnalyticsCards;