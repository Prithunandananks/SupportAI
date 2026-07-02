import { useEffect, useRef } from "react";
import type { Message } from "./Message";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
}

function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 space-y-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
        />
      ))}

      <div ref={bottomRef}></div>
    </div>
  );
}

export default MessageList;