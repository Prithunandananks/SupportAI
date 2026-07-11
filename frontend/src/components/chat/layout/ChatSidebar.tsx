import { useState, useRef, useEffect, useMemo } from "react";
import { Pin, MoreVertical, Edit2, Trash2 } from "lucide-react";
import type { ChatSession } from "@/components/chat/messages/Message";
import { formatTimeAgo } from "@/utils/dateFormatter";

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onTogglePin,
  onRename,
  onDelete,
  isOpen,
  onClose,
}: Props) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sessions]);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveRename(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-cyan-400">SupportAI</h2>
          <button
            onClick={onClose}
            className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <button
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="mx-4 mt-4 rounded-xl bg-cyan-500 py-3 font-semibold transition-all duration-300 hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">
            Recent Chats
          </h3>

          {sortedSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {sortedSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative flex flex-col rounded-lg border transition ${
                    activeSessionId === chat.id
                      ? "bg-slate-800 border-cyan-500/50"
                      : "bg-transparent hover:bg-slate-800 border-transparent hover:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(chat.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="w-full text-left px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      {editingId === chat.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, chat.id)}
                          onBlur={() => handleSaveRename(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-sm outline-none text-white mr-2"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white truncate pr-2 flex items-center">
                          {chat.pinned && <Pin size={12} className="mr-1.5 text-cyan-400 fill-cyan-400 shrink-0" />}
                          <span className="truncate">{chat.title}</span>
                        </span>
                      )}

                      {!editingId && (
                        <div 
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                            }}
                            className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition ${menuOpenId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreVertical size={14} />
                          </button>

                          {menuOpenId === chat.id && (
                            <div 
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(chat.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center"
                              >
                                <Pin size={14} className="mr-2" />
                                {chat.pinned ? 'Unpin Chat' : 'Pin Chat'}
                              </button>
                              <button
                                onClick={(e) => handleStartRename(chat, e)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center"
                              >
                                <Edit2 size={14} className="mr-2" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(chat.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!editingId && (
                      <span className="text-xs text-slate-500 block">
                        {formatTimeAgo(chat.updatedAt)}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default ChatSidebar;