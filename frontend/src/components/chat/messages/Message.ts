export interface Message {
  id: string | number;
  sender: "user" | "assistant";
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
}