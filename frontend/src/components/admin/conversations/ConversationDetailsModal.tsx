import { X } from "lucide-react";
import type { Conversation } from "@/pages/admin/Conversations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  conversation: Conversation | null;
}

function ConversationDetailsModal({ isOpen, onClose, onDelete, conversation }: Props) {
  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      {/* Click outside to close (backdrop) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-semibold text-white">Conversation Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 text-sm">
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Customer Name</p>
              <p className="text-white font-medium truncate">{conversation.customerName}</p>
            </div>
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Status</p>
              <p className={`font-medium ${conversation.status === "Completed" ? "text-green-400" : "text-yellow-400"}`}>
                {conversation.status}
              </p>
            </div>
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Started</p>
              <p className="text-white font-medium truncate">{conversation.startedAt}</p>
            </div>
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Duration</p>
              <p className="text-white font-medium">{conversation.duration}</p>
            </div>
            <div className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
              <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Total Messages</p>
              <p className="text-white font-medium">{conversation.messageCount}</p>
            </div>
          </div>

          {/* Conversation History */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Conversation History</h3>
            <div className="space-y-4">
              {conversation.messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-start" : "items-end"}`}>
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    {msg.role === "user" ? "👤 Customer" : "🤖 SupportAI"} • {msg.timestamp}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${msg.role === "user" ? "bg-slate-800 text-slate-200 rounded-tl-sm" : "bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Conversation Summary</h3>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm italic">
              {conversation.summary}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-800 flex justify-between shrink-0">
          {onDelete ? (
            <button onClick={onDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition text-sm">
              Delete
            </button>
          ) : <div></div>}
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition text-sm">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConversationDetailsModal;
