import { formatTimeAgo } from "@/utils/dateFormatter";
import { MessageSquarePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "./DashboardCard";

export interface DashboardChat {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

interface Props {
  chats: DashboardChat[];
  onContinue: (chatId: string) => void;
}

function RecentChats({ chats, onContinue }: Props) {
  const navigate = useNavigate();

  const action = null;

  return (
    <DashboardCard title="Recent Conversations" action={action}>
      {chats.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <MessageSquarePlus size={32} />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">No conversations yet</h4>
          <p className="text-slate-400 mb-6 text-sm">Ask SupportAI your first question to get started.</p>
          <button 
            onClick={() => navigate("/chat")}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Start Your First Conversation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onContinue(chat.id)}
              className="w-full text-left bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div>
                <h4 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors mb-1">
                  {chat.title}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-1">{chat.preview}</p>
              </div>
              <span className="text-xs font-medium text-slate-500 shrink-0 whitespace-nowrap">
                {formatTimeAgo(chat.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

export default RecentChats;
