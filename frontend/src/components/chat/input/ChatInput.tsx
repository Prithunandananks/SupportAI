import React, { useState } from "react";
import { SendHorizontal, Square } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  isTyping?: boolean;
  onStop?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

function ChatInput({ onSend, isTyping, onStop, inputRef }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
    
    // Reset height
    if (inputRef && inputRef.current) {
      inputRef.current.style.height = "56px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping) {
        handleSend();
      }
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "56px"; // reset to measure
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-6">

      <div className="flex items-end gap-4 max-w-5xl mx-auto">

        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={text}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your company..."
          rows={1}
          className="
            flex-1
            bg-slate-800
            border
            border-slate-700
            rounded-2xl
            px-6
            py-4
            outline-none
            transition-all
            duration-300
            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-500/20
            resize-none
            overflow-y-auto
            min-h-[56px]
          "
          style={{ height: '56px' }}
        />

        {isTyping ? (
          <button
            onClick={onStop}
            className="
              flex items-center gap-2
              bg-slate-800
              hover:bg-slate-700
              border border-slate-700
              px-6
              py-4
              rounded-2xl
              transition-all
              duration-300
              h-[56px]
            "
            aria-label="Stop Generating"
          >
            <Square size={16} fill="currentColor" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="
              flex items-center gap-2
              bg-cyan-500
              hover:bg-cyan-600
              disabled:opacity-50
              disabled:cursor-not-allowed
              px-6
              py-4
              rounded-2xl
              transition-all
              duration-300
              hover:scale-105
              hover:shadow-lg
              hover:shadow-cyan-500/20
              h-[56px]
            "
            aria-label="Send Message"
          >
            <SendHorizontal size={18} />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}

      </div>

    </div>
  );
}

export default ChatInput;