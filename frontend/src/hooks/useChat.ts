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
        setError(err.message);
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, text: msg.text + (msg.text ? "\n\n" : "") + `[Error: ${err.message}]` } 
              : msg
          )
        );
      },
      abortController.signal
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
    if (messages.length < 2) return;
    
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.sender === "user");
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
    
    // Remove all messages after the last user message
    setMessages(prev => prev.slice(0, prev.length - lastUserMessageIndex));
    
    // Send it again
    await sendMessage(lastUserMessage.text, true);
  }, [messages, sendMessage]);

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
    regenerateMessage
  };
}