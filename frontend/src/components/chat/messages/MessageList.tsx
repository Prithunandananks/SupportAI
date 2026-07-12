import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import type { Message } from "./Message";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onRegenerate?: () => void;
  messageErrors?: Record<number | string, string>;
  isRegenerating?: boolean;
}

function MessageList({ messages, onRegenerate, messageErrors, isRegenerating }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom("auto"); // use auto during streaming for better feel, smooth only for manual
    }
  }, [messages, isScrolledUp]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // If we are within 100px of the bottom, consider it "at bottom"
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsScrolledUp(!isAtBottom);
  };

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-hidden relative">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-10 py-8 space-y-4"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            onRegenerate={onRegenerate}
            error={messageErrors ? messageErrors[message.id as number] : undefined}
            isRegenerating={isRegenerating}
          />
        ))}

        <div ref={bottomRef} className="h-4"></div>
      </div>

      {isScrolledUp && (
        <button
          onClick={() => {
            setIsScrolledUp(false);
            scrollToBottom();
          }}
          className="
            absolute
            bottom-6
            right-1/2
            translate-x-1/2
            bg-slate-700
            hover:bg-slate-600
            text-white
            p-2
            rounded-full
            shadow-lg
            border border-slate-600
            transition-all
            duration-300
            z-10
            animate-in fade-in slide-in-from-bottom-2
          "
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}

export default MessageList;