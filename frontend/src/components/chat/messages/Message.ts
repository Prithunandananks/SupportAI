export interface Message {
  id: string | number;
  sender: "user" | "assistant";
  text: string;
  timestamp?: string;
  sources?: { filename: string; document_id?: string; chunk_index?: number; retrieved_text?: string; retrieval_score?: number }[];
  confidence?: "High" | "Medium" | "Low";
}

export interface Conversation {
  id: string;
  title: string;
}