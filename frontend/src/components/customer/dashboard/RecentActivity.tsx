import type { Activity } from "@/store/ChatContext";
import { formatTimeAgo } from "@/utils/dateFormatter";
import { MessageSquare, Settings, Activity as ActivityIcon, MessageCircle, Trash2, Pencil, Pin, PinOff, User } from "lucide-react";
import DashboardCard from "./DashboardCard";

interface Props {
  activities: Activity[];
}

const getIcon = (type: Activity["type"]) => {
  switch (type) {
    case "new_chat": return <MessageCircle size={14} />;
    case "continued_chat": return <MessageSquare size={14} />;
    case "deleted_chat": return <Trash2 size={14} />;
    case "renamed_chat": return <Pencil size={14} />;
    case "pinned_chat": return <Pin size={14} />;
    case "unpinned_chat": return <PinOff size={14} />;
    case "profile_updated": return <User size={14} />;
    case "settings_updated": return <Settings size={14} />;
    default: return <ActivityIcon size={14} />;
  }
};

function RecentActivity({ activities }: Props) {
  return (
    <DashboardCard title="Recent Activity">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <ActivityIcon className="mx-auto h-12 w-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">No recent activity.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-800 ml-4 space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 group">
              {/* Timeline Dot */}
              <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 z-10 transition-colors group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10">
                {getIcon(activity.type)}
              </div>
              
              <p className="text-sm text-slate-300 font-medium mb-1 transition-colors group-hover:text-cyan-400">{activity.title}</p>
              <p className="text-xs text-slate-500">{formatTimeAgo(activity.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

export default RecentActivity;
