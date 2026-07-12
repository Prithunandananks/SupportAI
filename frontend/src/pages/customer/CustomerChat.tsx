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
import { chatService } from "@/services/chat.service";

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
      const now = new Date().toISOString();
      const tempId = generateId();
      
      const newSession: ChatSession = {
        id: tempId,
        title: text,
        pinned: false,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        messages: [],
        messagesLoaded: true
      };
      
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(tempId);
      targetSessionId = tempId;
      logActivity("new_chat", "Started a new conversation");
      
      // We will create the actual session in the backend before sending
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
    
    const sendToBackend = async () => {
      try {
        let actualSessionId = targetSessionId;
        
        // If this is a temporary session (created just now, not from backend), create it in backend
        const isTemp = !sessions.find(s => s.id === targetSessionId) || activeSessionId === null;
        if (isTemp) {
          const created = await chatService.createSession(text);
          actualSessionId = created.id;
          
          setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
              return { ...s, id: actualSessionId };
            }
            return s;
          }));
          setActiveSessionId(actualSessionId);
        }
        
        const aiMessageId = generateId();
        const aiMessage: Message = {
          id: aiMessageId,
          sender: "assistant",
          text: "",
          createdAt: new Date().toISOString(),
        };
        
        setSessions(prev => prev.map(session => {
          if (session.id === actualSessionId) {
            return {
              ...session,
              updatedAt: aiMessage.createdAt!,
              lastMessageAt: aiMessage.createdAt!,
              messages: [...session.messages, aiMessage]
            };
          }
          return session;
        }));
        
        setIsTyping(false);
        
        await chatService.streamMessage(
          actualSessionId,
          text,
          (chunk) => {
            setSessions(prev => prev.map(session => {
              if (session.id === actualSessionId) {
                return {
                  ...session,
                  messages: session.messages.map(msg => {
                    if (msg.id === aiMessageId) {
                      return { ...msg, text: msg.text + chunk };
                    }
                    return msg;
                  })
                };
              }
              return session;
            }));
          },
          () => {
            // Completed
          },
          (err) => {
            console.error("Stream error", err);
            toast.error("Failed to generate response.");
          },
          (metadata) => {
            setSessions(prev => prev.map(session => {
              if (session.id === actualSessionId) {
                return {
                  ...session,
                  messages: session.messages.map(msg => {
                    if (msg.id === aiMessageId) {
                      let confidenceScore = msg.confidence;
                      if (metadata.confidence) {
                         if (metadata.confidence === "High") confidenceScore = 95;
                         else if (metadata.confidence === "Medium") confidenceScore = 75;
                         else confidenceScore = 50;
                      }
                      return { 
                        ...msg, 
                        sources: metadata.sources ? metadata.sources.map((c) => ({
                          id: c.document_id || generateId(),
                          name: c.filename || "Document",
                          page: c.chunk_index || 1,
                          section: c.retrieved_text ? c.retrieved_text.substring(0, 50) : "",
                          relevance: Math.round(confidenceScore ?? 95)
                        })) : msg.sources,
                        confidence: confidenceScore
                      };
                    }
                    return msg;
                  })
                };
              }
              return session;
            }));
          }
        );
      } catch {
        setIsTyping(false);
        toast.error("An error occurred while communicating with the AI.");
      }
    };
    
    sendToBackend();
  }, [activeSessionId, sessions, setSessions, logActivity]);

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
  
  const handleRenameSession = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await chatService.renameSession(id, newTitle.trim());
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
      logActivity("renamed_chat", "Renamed conversation");
      toast.success("Chat renamed successfully");
    } catch {
      toast.error("Failed to rename chat");
    }
  };
  
  const confirmDelete = (id: string) => {
    setSessionToDelete(id);
  };
  
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      await chatService.deleteSession(sessionToDelete);
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
    } catch {
      toast.error("Failed to delete chat");
    } finally {
      setSessionToDelete(null);
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await chatService.getSessions();
        const mapped: ChatSession[] = res.map(s => ({
          id: s.id,
          title: s.title || "New Chat",
          pinned: false,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          lastMessageAt: s.updated_at,
          messages: [],
          messagesLoaded: false
        }));
        // Sort by updatedAt descending
        mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSessions(mapped);
        if (mapped.length > 0 && !activeSessionId && !location.state?.newChat) {
          setActiveSessionId(mapped[0].id);
        }
      } catch {
        toast.error("Failed to load chat history");
      }
    };
    
    // We only want to fetch on initial mount if sessions are empty
    if (sessions.length === 0) {
      fetchSessions();
    }
  }, [sessions.length, location.state, activeSessionId, setSessions]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) return;
      const session = sessions.find(s => s.id === activeSessionId);
      if (session && !session.messagesLoaded && session.id.includes("-")) {
        try {
          const full = await chatService.getSession(activeSessionId);
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                messages: full.messages.map(m => ({
                  id: m.id,
                  sender: m.role === "user" ? "user" : "assistant",
                  text: m.content,
                  createdAt: m.created_at,
                })),
                messagesLoaded: true
              };
            }
            return s;
          }));
        } catch {
          console.error("Failed to load messages");
        }
      }
    };
    loadMessages();
  }, [activeSessionId, sessions, setSessions]);

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
