import { useState } from "react";
import type { ReactNode } from "react";
import type { ChatSession } from "@/components/chat/messages/Message";
import { ChatContext, type Activity } from "./ChatContextCore";

// Initialize with no conversations, acting as the Single Source of Truth
const initialMockSessions: ChatSession[] = [];



export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialMockSessions);
  const [activities, setActivities] = useState<Activity[]>([]);

  return (
    <ChatContext.Provider value={{ sessions, setSessions, activities, setActivities }}>
      {children}
    </ChatContext.Provider>
  );
}


