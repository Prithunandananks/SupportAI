import { createContext } from "react";
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

export interface ChatContextType {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
