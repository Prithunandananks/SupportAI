import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ChatSession } from "@/components/chat/messages/Message";

export interface Activity {
  id: string;
  type:
    | "new_chat"
    | "continued_chat"
    | "deleted_chat"
    | "renamed_chat"
    | "pinned_chat"
    | "unpinned_chat"
    | "profile_updated"
    | "settings_updated";
  title: string;
  createdAt: string;
}

// Initialize with no conversations, acting as the Single Source of Truth
export const initialMockSessions: ChatSession[] = [];

interface ChatContextType {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialMockSessions);
  const [activities, setActivities] = useState<Activity[]>([]);

  return (
    <ChatContext.Provider value={{ sessions, setSessions, activities, setActivities }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
