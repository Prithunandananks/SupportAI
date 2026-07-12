import { useEffect, useState, useMemo } from "react";
import ConversationRow from "./ConversationRow";
import { adminService } from "@/services/admin.service";
import type { AdminConversation } from "@/services/admin.service";
import { chatService, type ChatSessionWithMessagesResponse } from "@/services/chat.service";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";

function ConversationTable() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [inspectSession, setInspectSession] = useState<ChatSessionWithMessagesResponse | null>(null);

  useEffect(() => {
    adminService.getRecentConversations(100)
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load conversations", err);
        setError("Failed to load conversations.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await chatService.deleteSession(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      toast.success("Conversation deleted");
      } catch (err) {
        console.error("error", err);
        toast.error("Failed to delete conversation");
      }
    };
  
    const handleInspect = async (id: string) => {
      try {
        const session = await chatService.getSession(id);
        setInspectSession(session);
      } catch (err) {
        console.error("error", err);
        toast.error("Failed to inspect conversation");
      }
    };
  
    const handleExport = async (id: string) => {
      try {
        const session = await chatService.getSession(id);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `conversation_${id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Export successful");
      } catch (err) {
        console.error("error", err);
        toast.error("Failed to export conversation");
      }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const q = searchQuery.toLowerCase();
      const matchesTitle = (conv.title || "").toLowerCase().includes(q);
      const matchesName = (conv.user?.first_name || "").toLowerCase().includes(q);
      const matchesEmail = (conv.user?.email || "").toLowerCase().includes(q);
      return matchesTitle || matchesName || matchesEmail;
    });
  }, [conversations, searchQuery]);

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-semibold">
            Recent Conversations
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search user or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition w-full md:w-64"
            />
          </div>
        </div>

        {error ? (
          <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900 mt-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-4 px-4 font-medium text-slate-300">Customer</th>
                  <th className="pb-4 px-4 font-medium text-slate-300">Last Question</th>
                  <th className="pb-4 px-4 font-medium text-slate-300">Messages</th>
                  <th className="pb-4 px-4 font-medium text-slate-300">Time</th>
                  <th className="pb-4 px-4 font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse border-b border-slate-800/50">
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-32"></div></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-48"></div></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-8"></div></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-24"></div></td>
                      <td className="py-4 px-4"><div className="h-8 bg-slate-800 rounded w-40"></div></td>
                    </tr>
                  ))
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      id={conv.id}
                      customer={conv.user ? `${conv.user.first_name} ${conv.user.last_name || ""}` : "Guest"}
                      question={conv.title || "New Chat"}
                      messageCount={conv.message_count}
                      time={new Date(conv.created_at).toLocaleString()}
                      onInspect={handleInspect}
                      onDelete={handleDelete}
                      onExport={handleExport}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                          <span className="text-3xl">💬</span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">No conversations found</h3>
                        <p className="text-sm mt-1">Try adjusting your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inspectSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-semibold">Inspect: {inspectSession.title || "New Chat"}</h3>
              <button 
                onClick={() => setInspectSession(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {inspectSession.messages.length === 0 ? (
                <div className="text-slate-400 text-center">No messages in this session.</div>
              ) : (
                inspectSession.messages.map(msg => (
                  <div key={msg.id} className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-slate-800 ml-12' : 'bg-cyan-950/30 border border-cyan-900/30 mr-12'}`}>
                    <div className="font-semibold text-sm mb-1 text-slate-400 capitalize">{msg.role}</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ConversationTable;