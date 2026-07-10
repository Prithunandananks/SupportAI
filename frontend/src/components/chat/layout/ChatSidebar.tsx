import { useState, useMemo, useCallback } from "react";
import type { ChatSessionResponse } from "@/services/chat.service";
import { groupConversations, filterConversations } from "@/utils/conversation.utils";
import { SearchBar } from "../sidebar/SearchBar";
import { ConversationGroup } from "../sidebar/ConversationGroup";
import { DeleteConfirmationDialog } from "../sidebar/DeleteConfirmationDialog";
import { ConversationSkeleton } from "../sidebar/ConversationSkeleton";
import { EmptyState } from "../sidebar/EmptyState";
import { MessageSquarePlus } from "lucide-react";

interface Props {
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  conversations: ChatSessionResponse[];
  activeSessionId: string | null;
  isLoading: boolean;
}

function ChatSidebar({ 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  onRenameChat,
  conversations, 
  activeSessionId, 
  isLoading 
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSessionResponse | null>(null);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery]
  );

  const groupedConversations = useMemo(
    () => groupConversations(filteredConversations),
    [filteredConversations]
  );

  const handleRenameSave = useCallback((id: string, newTitle: string) => {
    onRenameChat(id, newTitle);
    setRenamingSessionId(null);
  }, [onRenameChat]);

  const handleDeleteConfirm = useCallback(() => {
    if (sessionToDelete) {
      onDeleteChat(sessionToDelete.id);
      setSessionToDelete(null);
    }
  }, [sessionToDelete, onDeleteChat]);

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2.5 font-medium transition"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <SearchBar query={searchQuery} onChange={setSearchQuery} />

      <div className="flex-1 overflow-y-auto pt-2 pb-20 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : groupedConversations.length === 0 ? (
          searchQuery ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <p className="text-sm text-slate-400">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <EmptyState onNewChat={onNewChat} />
          )
        ) : (
          groupedConversations.map((group) => (
            <ConversationGroup
              key={group.label}
              label={group.label}
              conversations={group.conversations}
              activeSessionId={activeSessionId}
              renamingSessionId={renamingSessionId}
              onSelect={onSelectChat}
              onRenameStart={setRenamingSessionId}
              onRenameSave={handleRenameSave}
              onRenameCancel={() => setRenamingSessionId(null)}
              onDeleteRequest={setSessionToDelete}
            />
          ))
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={!!sessionToDelete}
        title={sessionToDelete?.title || "New Chat"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
  );
}

export default ChatSidebar;