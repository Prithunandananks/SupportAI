export interface Message {
  id: number;
  sender: "user" | "assistant";
  text: string;
}

export interface Conversation {
  id: number;
  title: string;
}