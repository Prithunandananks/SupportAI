import { MessageSquare } from "lucide-react";
import type { ChatSessionResponse } from "@/services/chat.service";
import { formatConversationDate } from "@/utils/conversation.utils";
import { RenameInput } from "./RenameInput";
import { ConversationMenu } from "./ConversationMenu";

interface ConversationItemProps {
  session: ChatSessionResponse;
  isActive: boolean;
  isRenaming: boolean;
  onClick: () => void;
  onRenameStart: () => void;
  onRenameSave: (newTitle: string) => void;
  onRenameCancel: () => void;
  onDeleteRequest: () => void;
}

export function ConversationItem({
  session,
  isActive,
  isRenaming,
  onClick,
  onRenameStart,
  onRenameSave,
  onRenameCancel,
  onDeleteRequest
}: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex flex-col px-3 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? "bg-slate-800/80 text-white" 
          : "text-slate-300 hover:bg-slate-800/50"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex items-center justify-between min-h-[24px]">
        {isRenaming ? (
          <RenameInput
            initialTitle={session.title || "New Chat"}
            onSave={onRenameSave}
            onCancel={onRenameCancel}
          />
        ) : (
          <>
            <div className="flex items-center space-x-3 overflow-hidden">
              <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span className="text-sm font-medium truncate">
                {session.title || "New Chat"}
              </span>
            </div>
            
            <div className="flex items-center shrink-0 ml-2">
              <ConversationMenu 
                onRename={onRenameStart}
                onDelete={onDeleteRequest}
              />
            </div>
          </>
        )}
      </div>
      
      {!isRenaming && (
        <div className="flex items-center justify-between mt-1 pl-7 pr-1">
          {/* We would put a snippet here if we had one in ChatSessionResponse */}
          <span className="text-xs text-slate-500 truncate mr-2">
            
          </span>
          <span className="text-xs text-slate-500 shrink-0">
            {formatConversationDate(session.updated_at)}
          </span>
        </div>
      )}
    </div>
  );
}
