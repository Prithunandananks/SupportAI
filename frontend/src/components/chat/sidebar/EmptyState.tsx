import { MessageSquarePlus } from "lucide-react";

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 px-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
        <MessageSquarePlus className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-200">No conversations yet</h3>
        <p className="text-xs text-slate-500 mt-1">Start a new conversation to begin.</p>
      </div>
      <button
        onClick={onNewChat}
        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
      >
        Create New Chat
      </button>
    </div>
  );
}
