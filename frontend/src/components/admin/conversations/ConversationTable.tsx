import { useEffect, useState } from "react";
import ConversationRow from "./ConversationRow";
import { adminService } from "@/services/admin.service";
import type { AdminConversation } from "@/services/admin.service";

function ConversationTable() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getRecentConversations(10)
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

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[400px] animate-pulse">
        <h2 className="text-2xl font-semibold mb-6">Recent Conversations</h2>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-800 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900 mt-4">{error}</div>;
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Recent Conversations
      </h2>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="pb-4">Customer</th>
            <th className="pb-4">Last Question</th>
            <th className="pb-4">Time</th>
            <th className="pb-4">Status</th>
            <th className="pb-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              customer={conv.user?.first_name || "Guest"}
              question={conv.title || "New Chat"}
              time={new Date(conv.created_at).toLocaleDateString()}
              status="Completed" // mocked status since we don't track status
            />
          ))}
          {conversations.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-slate-400">No recent conversations.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ConversationTable;