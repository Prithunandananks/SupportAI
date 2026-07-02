import { useState } from "react";
import type { Message, Conversation } from "@/components/chat/messages/Message";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text,
    };
    if (messages.length === 0) {
      setConversations((prev) => [
        {
          id: Date.now(),
          title: text,
        },
        ...prev,
      ]);
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text:
          "🤖 This is a temporary AI response. Later, FastAPI + Qdrant + the LLM will generate the real answer.",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };
  const clearChat = () => {
        setMessages([]);
    };
  
  return {
    messages,
    sendMessage,
    clearChat,
    isTyping,
    conversations,
  };
}