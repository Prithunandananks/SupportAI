import { useState, useEffect } from "react";
import { SendHorizontal } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
}

function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }, []);

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4 md:p-6">

      <div className="relative max-w-5xl mx-auto">

        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder={
            isMobile
              ? "Ask a question..."
              : "Ask anything about your company..."
          }
          className="
            w-full
            rounded-2xl
            border
            border-slate-700
            bg-slate-800
            pl-4
            md:pl-5

            pr-14
            md:pr-16

            py-3
            md:py-4

            text-white
            placeholder:text-slate-400

            outline-none
            transition-all
            duration-300

            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-500/20
          "
        />

        <button
          onClick={handleSend}
          className="
            absolute
            right-2
            top-1/2
            -translate-y-1/2

            flex
            h-10
            w-10
            md:h-11
            md:w-11
            items-center
            justify-center

            rounded-xl

            bg-cyan-500
            hover:bg-cyan-600

            transition-all
            duration-300

            hover:scale-105
            hover:shadow-lg
            hover:shadow-cyan-500/20
          "
        >
          <SendHorizontal size={18} />
        </button>

      </div>

    </div>
  );
}

export default ChatInput;