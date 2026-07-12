import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/components/chat/messages/Message";
import { chatService, type ChatSessionResponse } from "../services/chat.service";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<ChatSessionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [messageErrors, setMessageErrors] = useState<Record<number | string, string>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    cancelStream();
    setActiveSessionId(sessionId);
    setIsHistoryLoading(true);
    setError(null);
    try {
      const sessionData = await chatService.getSession(sessionId);
      const mappedMessages: Message[] = sessionData.messages.map((m) => ({
        id: m.id,
        sender: m.role as "user" | "assistant",
        text: m.content,
      }));
      setMessages(mappedMessages);
    } catch (err) {
      console.error(err);
      setError("Failed to load chat history.");
      setMessages([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [cancelStream]);

  const loadSessions = useCallback(async () => {
    cancelStream();
    setIsConversationsLoading(true);
    try {
      const sessions = await chatService.getSessions();
      setConversations(sessions);
      
      if (sessions.length > 0) {
        await selectSession(sessions[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConversationsLoading(false);
    }
  }, [cancelStream, selectSession]);

  const sendMessage = useCallback(async (text: string, skipUserMessage = false) => {
    if (!text.trim()) return;

    cancelStream();
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      try {
        const newSession = await chatService.createSession(text.substring(0, 30));
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        setConversations(prev => [newSession, ...prev]);
      } catch {
        setError("Failed to create new chat session.");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text,
    };
    
    const assistantMessageId = Date.now() + 1;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      sender: "assistant",
      text: "",
    };
    
    if (!skipUserMessage) {
      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    } else {
      setMessages((prev) => [...prev, initialAssistantMessage]);
    }
    
    setIsTyping(true);
    setError(null);
    setMessageErrors((prev) => {
      const next = { ...prev };
      delete next[assistantMessageId];
      return next;
    });
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    await chatService.streamMessage(
      currentSessionId,
      text,
      (chunk: string) => {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, text: msg.text + chunk } 
              : msg
          )
        );
      },
      () => {
        setIsTyping(false);
        abortControllerRef.current = null;
      },
      (err: Error) => {
        setIsTyping(false);
        abortControllerRef.current = null;
        setError("Failed to complete response.");
        setMessageErrors((prev) => ({ ...prev, [assistantMessageId]: err.message }));
      },
      (metadata) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, sources: metadata.sources, confidence: metadata.confidence }
              : msg
          )
        );
      },
      abortController.signal,
      false // not regenerating
    );
  }, [activeSessionId, cancelStream]);
  
  const createNewChat = useCallback(() => {
    cancelStream();
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  }, [cancelStream]);

  const renameChat = useCallback(async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    const previous = [...conversations];
    
    // Optimistic UI update
    setConversations(prev => 
      prev.map(c => c.id === sessionId ? { ...c, title: newTitle } : c)
    );
    
    try {
      await chatService.patchSession(sessionId, newTitle);
    } catch (err) {
      console.error("Failed to rename:", err);
      // Rollback
      setConversations(previous);
      throw err;
    }
  }, [conversations]);

  const deleteChat = useCallback(async (sessionId: string) => {
    if (activeSessionId === sessionId) {
      cancelStream();
    }
    try {
      await chatService.deleteSession(sessionId);
      
      setConversations(prev => {
        const remaining = prev.filter(c => c.id !== sessionId);
        return remaining;
      });
      
      if (activeSessionId === sessionId) {
        createNewChat();
      }
      
    } catch (err) {
      console.error(err);
      setError("Failed to delete conversation.");
      throw err;
    }
  }, [activeSessionId, cancelStream, createNewChat]);
  
  const regenerateMessage = useCallback(async () => {
    if (messages.length < 2 || isRegenerating || isTyping) return;
    if (!activeSessionId) return;
    
    // Find the last user message and last assistant message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.sender === "user");
    if (lastUserMessageIndex === -1) return;
    
    const lastAssistantMessageIndex = [...messages].reverse().findIndex(m => m.sender === "assistant");
    if (lastAssistantMessageIndex === -1) return;

    const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
    const assistantMessageId = messages[messages.length - 1 - lastAssistantMessageIndex].id;
    
    // Clear the assistant message text in UI and remove error if present
    setMessages((prev) => prev.map(msg => msg.id === assistantMessageId ? { ...msg, text: "" } : msg));
    setMessageErrors((prev) => {
      const next = { ...prev };
      delete next[assistantMessageId];
      return next;
    });

    setIsTyping(true);
    setIsRegenerating(true);
    setError(null);
    
    cancelStream();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    await chatService.streamMessage(
      activeSessionId,
      lastUserMessage.text,
      (chunk: string) => {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, text: msg.text + chunk } 
              : msg
          )
        );
      },
      () => {
        setIsTyping(false);
        setIsRegenerating(false);
        abortControllerRef.current = null;
      },
      (err: Error) => {
        setIsTyping(false);
        setIsRegenerating(false);
        abortControllerRef.current = null;
        setError("Failed to complete response.");
        setMessageErrors((prev) => ({ ...prev, [assistantMessageId]: err.message }));
      },
      (metadata) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, sources: metadata.sources, confidence: metadata.confidence }
              : msg
          )
        );
      },
      abortController.signal,
      true // regenerate = true
    );
  }, [messages, activeSessionId, isRegenerating, isTyping, cancelStream]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
    return () => {
      cancelStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    sendMessage,
    clearChat: createNewChat,
    deleteChat,
    renameChat,
    selectSession,
    isTyping,
    conversations,
    error,
    activeSessionId,
    isConversationsLoading,
    isHistoryLoading,
    cancelStream,
    regenerateMessage,
    messageErrors,
    isRegenerating
  };
}