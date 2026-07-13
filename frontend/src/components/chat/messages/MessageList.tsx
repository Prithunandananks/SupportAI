import { useEffect, useRef } from "react";
import type { Message, Source } from "./Message";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onFeedback?: (messageId: string | number, feedback: "like" | "dislike") => void;
  onFlag?: (messageId: string | number) => void;
  onSourceClick?: (source: Source) => void;
}

function MessageList({ messages, onFeedback, onFlag, onSourceClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
        className="
          flex-1
          overflow-y-auto
          px-4
          md:px-10
          py-6
          md:py-8
          space-y-6
          scroll-smooth
        "
      >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onFeedback={onFeedback}
          onFlag={onFlag}
          onSourceClick={onSourceClick}
        />
      ))}

      <div ref={bottomRef}></div>
    </div>
  );
}

export default MessageList;