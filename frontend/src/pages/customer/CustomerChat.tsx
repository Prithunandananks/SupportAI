import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import ChatSidebar from "@/components/chat/layout/ChatSidebar";
import ChatHeader from "@/components/chat/layout/ChatHeader";
import WelcomeScreen from "@/components/chat/welcome/WelcomeScreen";
import ChatInput from "@/components/chat/input/ChatInput";
import MessageList from "@/components/chat/messages/MessageList";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import type { ChatSession, Message } from "@/components/chat/messages/Message";
import { useChat } from "@/hooks/useChatContext";

const generateId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString();
};

function CustomerChat() {
  const { sessions, setSessions, setActivities } = useChat();
  const location = useLocation();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (location.state?.newChat) return null;
    if (location.state?.activeSessionId) return location.state.activeSessionId;
    return sessions.length > 0 ? sessions[0].id : null;
  });

  const logActivity = useCallback((type: "new_chat" | "continued_chat" | "deleted_chat" | "renamed_chat" | "pinned_chat" | "unpinned_chat" | "profile_updated" | "settings_updated", title: string) => {
    setActivities((prev) => [
      {
        id: generateId(),
        type,
        title,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [setActivities]);
  


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [messageToFlag, setMessageToFlag] = useState<string | number | null>(null);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setTimeout(() => {
      document.getElementById("chat-input")?.focus();
    }, 0);
  };

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    
    let targetSessionId = activeSessionId;
    
    if (!targetSessionId) {
      targetSessionId = generateId();
      const now = new Date().toISOString();
      const newSession: ChatSession = {
        id: targetSessionId,
        title: text,
        pinned: false,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        messages: []
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
      logActivity("new_chat", "Started a new conversation");
    } else {
      logActivity("continued_chat", "Continued conversation");
    }
    
    const now = new Date().toISOString();
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text,
      createdAt: now,
    };
    
    setSessions(prev => prev.map(session => {
      if (session.id === targetSessionId) {
        const newTitle = session.title === "New Chat" && session.messages.length === 0 ? text : session.title;
        return {
          ...session,
          title: newTitle,
          updatedAt: now,
          lastMessageAt: now,
          messages: [...session.messages, userMessage]
        };
      }
      return session;
    }));
    
    setIsTyping(true);
    
    setTimeout(() => {
      const aiNow = new Date().toISOString();
      const aiMessage: Message = {
        id: generateId(),
        sender: "assistant",
        text: "This is a temporary AI response. Later, FastAPI + Qdrant + the LLM will generate the real answer.",
        createdAt: aiNow,
        confidence: 96,
        sources: [
          {
            id: generateId(),
            name: "Employee_Handbook.pdf",
            page: 12,
            section: "3",
            relevance: 96
          }
        ],
        feedback: null,
        flagged: false,
      };
      
      setSessions(prev => prev.map(session => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            updatedAt: aiNow,
            lastMessageAt: aiNow,
            messages: [...session.messages, aiMessage]
          };
        }
        return session;
      }));
      setIsTyping(false);
    }, 800);
  }, [activeSessionId, setSessions, logActivity]);

  const handleMessageFeedback = (messageId: string | number, feedback: "like" | "dislike") => {
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: session.messages.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, feedback: msg.feedback === feedback ? null : feedback };
            }
            return msg;
          })
        };
      }
      return session;
    }));
  };

  const confirmFlagMessage = (messageId: string | number) => {
    setMessageToFlag(messageId);
  };

  const handleFlagMessage = () => {
    if (!messageToFlag || !activeSessionId) return;
    
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: session.messages.map(msg => {
            if (msg.id === messageToFlag) {
              return { ...msg, flagged: true };
            }
            return msg;
          })
        };
      }
      return session;
    }));
    
    toast.success("Response reported successfully.");
    setMessageToFlag(null);
  };

  const handleTogglePin = (id: string) => {
    setSessions(prev => {
      const sessionToToggle = prev.find(s => s.id === id);
      if (!sessionToToggle) return prev;

      if (!sessionToToggle.pinned) {
        const pinnedCount = prev.filter(s => s.pinned).length;
        if (pinnedCount >= 3) {
          toast.warning("You can only pin up to 3 conversations.");
          return prev;
        }
      }
      
      return prev.map(s => {
        if (s.id === id) {
          const isPinning = !s.pinned;
          if (isPinning) logActivity("pinned_chat", "Pinned conversation");
          else logActivity("unpinned_chat", "Unpinned conversation");
          return { ...s, pinned: isPinning };
        }
        return s;
      });
    });
  };
  
  const handleRenameSession = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
    logActivity("renamed_chat", "Renamed conversation");
    toast.success("Chat renamed successfully");
  };
  
  const confirmDelete = (id: string) => {
    setSessionToDelete(id);
  };
  
  const handleDeleteSession = () => {
    if (!sessionToDelete) return;
    
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionToDelete);
      
      if (sessionToDelete === activeSessionId) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
      return filtered;
    });
    
    toast.success("Chat deleted successfully");
    logActivity("deleted_chat", "Deleted conversation");
    setSessionToDelete(null);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (location.state) {      
      if (location.state.initialQuestion) {
        timer = setTimeout(() => {
          handleSendMessage(location.state.initialQuestion);
        }, 0);
      }
      
      window.history.replaceState({}, "");
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.state, handleSendMessage]);

  return (
    <div className="bg-slate-950 text-white h-screen flex overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onRename={handleRenameSession}
        onDelete={confirmDelete}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 overflow-y-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            <WelcomeScreen onQuestionClick={handleSendMessage} />
          ) : (
            <>
              <MessageList 
                messages={activeSession.messages} 
                onFeedback={handleMessageFeedback}
                onFlag={confirmFlagMessage}
              />

              {isTyping && (
                <div className="px-4 md:px-10 pb-6 flex">
                  <div className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-4 shadow-lg">
                    <p className="text-cyan-400 font-semibold mb-3">
                      SupportAI
                    </p>

                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"></span>

                      <span
                        className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>

                      <span
                        className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <ChatInput onSend={handleSendMessage} />
      </main>

      <ConfirmationModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleDeleteSession}
        title="Delete Conversation?"
        message="This conversation will be permanently removed from your recent chats."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={!!messageToFlag}
        onClose={() => setMessageToFlag(null)}
        onConfirm={handleFlagMessage}
        title="Report this AI response?"
        message="This response will be marked for administrator review."
        confirmText="Report"
        cancelText="Cancel"
      />
    </div>
  );
}

export default CustomerChat;
