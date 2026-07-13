import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ChatSidebar from "@/components/chat/layout/ChatSidebar";
import ChatHeader from "@/components/chat/layout/ChatHeader";
import WelcomeScreen from "@/components/chat/welcome/WelcomeScreen";
import ChatInput from "@/components/chat/input/ChatInput";
import MessageList from "@/components/chat/messages/MessageList";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import ReportMessageModal from "@/components/chat/messages/ReportMessageModal";
import type { ChatSession, Message, Source } from "@/components/chat/messages/Message";
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
  const navigate = useNavigate();
  const handleSendMessageRef = useRef<((text: string) => void) | null>(null);

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
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

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
        let currentAiMessageId = aiMessageId;
        let currentUserMessageId = userMessage.id;
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
                    if (msg.id === currentAiMessageId) {
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
            const oldUserMsgId = currentUserMessageId;
            const oldAiMsgId = currentAiMessageId;
            const newUserMsgId = metadata.user_message_id;
            const newAiMsgId = metadata.message_id;

            if (newUserMsgId) currentUserMessageId = newUserMsgId;
            if (newAiMsgId) currentAiMessageId = newAiMsgId;

            setSessions(prev => prev.map(session => {
              if (session.id === actualSessionId) {
                return {
                  ...session,
                  messages: session.messages.map(msg => {
                    if (msg.id === oldUserMsgId && newUserMsgId) {
                      return { ...msg, id: newUserMsgId };
                    }
                    if (msg.id === oldAiMsgId) {
                      let confidenceScore = msg.confidence;
                      if (metadata.confidence !== undefined) {
                         confidenceScore = typeof metadata.confidence === "number" ? metadata.confidence : undefined;
                      }
                      
                      return { 
                        ...msg, 
                        id: newAiMsgId || oldAiMsgId,
                        sources: metadata.sources ? metadata.sources.map((c: { filename?: string; retrieval_score?: number }) => ({
                          id: generateId(),
                          name: c.filename || "Document",
                          relevance: typeof c.retrieval_score === 'number' 
                              ? (c.retrieval_score <= 1 ? Math.round(c.retrieval_score * 100) : c.retrieval_score) 
                              : 0
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

            // Handle title generation from metadata
            if (metadata.title) {
              const newTitle = metadata.title;
              setSessions(prev => prev.map(session => {
                if (session.id === actualSessionId) {
                  return { ...session, title: newTitle };
                }
                return session;
              }));
            }
          }
        );
      } catch {
        setIsTyping(false);
        toast.error("An error occurred while communicating with the AI.");
      }
    };
    
    sendToBackend();
  }, [activeSessionId, sessions, setSessions, logActivity]);

  // Keep a stable ref to handleSendMessage so effects can call it without retriggering
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleMessageFeedback = async (messageId: string | number, feedback: "like" | "dislike") => {
    try {
      await chatService.submitFeedback(activeSessionId!, messageId.toString(), feedback);
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => {
              if (msg.id === messageId) {
                return { ...msg, feedback };
              }
              return msg;
            })
          };
        }
        return session;
      }));
    } catch {
      toast.error("Failed to submit feedback.");
    }
  };

  const confirmFlagMessage = (messageId: string | number) => {
    setMessageToFlag(messageId);
  };

  const handleFlagMessage = async (reason: string, comment?: string) => {
    if (!messageToFlag || !activeSessionId) return;
    
    try {
      await chatService.flagMessage(activeSessionId, messageToFlag.toString(), reason, comment);
      toast.success("Response reported successfully.");
      
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
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Failed to report response.");
      }
    }
    
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
                  feedback: (m.feedback?.toLowerCase() === 'like' || m.feedback?.toLowerCase() === 'dislike') ? m.feedback.toLowerCase() as "like" | "dislike" : null,
                  flagged: m.flagged,
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

  const initialQuestionRef = useRef<string | null>(null);

  useEffect(() => {
    if (location.state?.initialQuestion) {
      const q = location.state.initialQuestion;
      
      // Guard against double submission via strict ref equality
      if (initialQuestionRef.current !== q) {
        initialQuestionRef.current = q;
        
        // Clear React Router state reliably
        navigate(location.pathname, { replace: true, state: {} });
        
        // Execute outside the render cycle
        setTimeout(() => {
          if (handleSendMessageRef.current) {
            handleSendMessageRef.current(q);
          }
        }, 0);
      }
    }
  }, [location.state, location.pathname, navigate]);

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
                onSourceClick={setSelectedSource}
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

      <ReportMessageModal
        isOpen={!!messageToFlag}
        onClose={() => setMessageToFlag(null)}
        onSubmit={handleFlagMessage}
      />

      {/* Source Excerpt Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Source Information</h2>
              <button 
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Document</p>
                <p className="text-white font-medium break-all">{selectedSource.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-1">Retrieval Score</p>
                <p className="text-cyan-400 font-medium">{selectedSource.relevance}%</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 italic mb-6">
              This response was generated using your organization's knowledge base.
            </p>

            <button
              onClick={() => setSelectedSource(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerChat;
