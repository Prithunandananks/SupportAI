interface Props {
  onNewChat: () => void;
  conversations: {
    id: number;
    title: string;
  }[];
}

function ChatSidebar({ onNewChat, conversations }: Props) {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <button
        onClick={onNewChat}
        className="m-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg py-3 font-semibold transition"
      >
        + New Chat
      </button>

      <div className="px-4">
        <h3 className="text-slate-400 text-sm mb-3 uppercase tracking-wider">
          Recent Chats
        </h3>

        <div className="space-y-2">

          {conversations.length === 0 ? (

            <p className="text-slate-500 text-sm">
              No conversations yet
            </p>

          ) : (

            conversations.map((chat) => (
              <div
                key={chat.id}
                className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 cursor-pointer"
              >
                {chat.title}
              </div>
            ))

          )}

        </div>
      </div>
    </aside>
  );
}

export default ChatSidebar;