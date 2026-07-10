import React from "react";
import type { ChatSessionResponse } from "@/services/chat.service";
import { ConversationItem } from "./ConversationItem";

interface ConversationGroupProps {
  label: string;
  conversations: ChatSessionResponse[];
  activeSessionId: string | null;
  renamingSessionId: string | null;
  onSelect: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameSave: (id: string, newTitle: string) => void;
  onRenameCancel: () => void;
  onDeleteRequest: (session: ChatSessionResponse) => void;
}

export const ConversationGroup = React.memo(function ConversationGroup({
  label,
  conversations,
  activeSessionId,
  renamingSessionId,
  onSelect,
  onRenameStart,
  onRenameSave,
  onRenameCancel,
  onDeleteRequest
}: ConversationGroupProps) {
  if (conversations.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </h3>
      <div className="flex flex-col">
        {conversations.map((session) => (
          <ConversationItem
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            isRenaming={session.id === renamingSessionId}
            onClick={() => onSelect(session.id)}
            onRenameStart={() => onRenameStart(session.id)}
            onRenameSave={(newTitle) => onRenameSave(session.id, newTitle)}
            onRenameCancel={onRenameCancel}
            onDeleteRequest={() => onDeleteRequest(session)}
          />
        ))}
      </div>
    </div>
  );
});
