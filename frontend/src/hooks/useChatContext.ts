import { useContext } from "react";
import { ChatContext } from "@/store/ChatContextCore";

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
