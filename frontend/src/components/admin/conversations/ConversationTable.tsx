import { useMemo, useState } from "react";
import ConversationRow from "./ConversationRow";
import SearchBar from "./SearchBar";
import type { Conversation } from "@/pages/admin/Conversations";

interface Props {
  conversations: Conversation[];
  onOpen: (conv: Conversation) => void;
}

function ConversationTable({ conversations, onOpen }: Props) {
  const [search, setSearch] = useState("");

  const filteredConversations = useMemo(() => {
    const query = search.toLowerCase();

    return conversations.filter((conversation) => {
      const userMessages = conversation.messages.filter(m => m.role === "user");
      const question = userMessages.length > 0 ? userMessages[0].content : conversation.summary;

      return (
        conversation.customerName.toLowerCase().includes(query) ||
        question.toLowerCase().includes(query) ||
        conversation.status.toLowerCase().includes(query) ||
        conversation.startedAt.toLowerCase().includes(query)
      );
    });
  }, [search, conversations]);

  return (
    <div
      className="
        bg-slate-900
        rounded-xl
        md:rounded-2xl
        border
        border-slate-800
        p-4
        md:p-6
      "
    >
      <h2 className="text-lg md:text-2xl font-semibold mb-5">
        Recent Conversations
      </h2>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {/* ================= Desktop ================= */}

      <div className="hidden md:block overflow-x-auto">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-lg">🔍 No conversations found</p>
            <p className="text-sm mt-2">
              Try searching with another keyword.
            </p>
          </div>
        ) : (
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
              {filteredConversations.map((conversation) => {
                const userMessages = conversation.messages.filter(m => m.role === "user");
                const question = userMessages.length > 0 ? userMessages[0].content : conversation.summary;

                return (
                  <ConversationRow
                    key={conversation.id}
                    customer={conversation.customerName}
                    question={question}
                    time={conversation.startedAt}
                    status={conversation.status}
                    onOpen={() => onOpen(conversation)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= Mobile ================= */}

      <div className="space-y-4 md:hidden">
        {filteredConversations.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
            <p className="text-slate-300 text-lg">
              🔍 No conversations found
            </p>

            <p className="text-slate-500 text-sm mt-2">
              Try another keyword.
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const userMessages = conversation.messages.filter(m => m.role === "user");
            const question = userMessages.length > 0 ? userMessages[0].content : conversation.summary;

            return (
              <div
                key={conversation.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    👤 {conversation.customerName}
                  </h3>

                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      conversation.status === "Completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {conversation.status}
                  </span>
                </div>

                <p className="text-slate-300 text-sm mt-3 line-clamp-2">
                  {question}
                </p>

                <p className="text-slate-500 text-xs mt-2">
                  {conversation.startedAt}
                </p>

              <button
                onClick={() => onOpen(conversation)}
                className="
                  mt-4
                  w-full
                  rounded-lg
                  bg-cyan-500
                  hover:bg-cyan-600
                  py-2
                  text-sm
                  transition
                "
              >
                Open
              </button>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationTable;