export interface Source {
  id: string;
  name: string;
  page: number;
  section: string;
  relevance: number;
}

export interface Message {
  id: string | number;
  sender: "user" | "assistant";
  text: string;
  createdAt?: string;
  confidence?: number;
  sources?: Source[];
  feedback?: "like" | "dislike" | null;
  flagged?: boolean;
}

export interface Conversation {
  id: number | string;
  title: string;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: Message[];
  messagesLoaded?: boolean;
}