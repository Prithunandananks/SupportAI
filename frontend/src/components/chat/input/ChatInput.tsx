import { useState } from "react";
import { SendHorizontal } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
}

function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-6">

      <div className="flex items-center gap-4">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Ask anything about your company..."
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
          "
        />

        <button
          onClick={handleSend}
          className="
            flex
            items-center
            gap-2
            bg-cyan-500
            hover:bg-cyan-600
            px-6
            py-4
            rounded-2xl
            transition-all
            duration-300
            hover:scale-105
            hover:shadow-lg
            hover:shadow-cyan-500/20
          "
        >
          <SendHorizontal size={18} />
          Send
        </button>

      </div>

    </div>
  );
}

export default ChatInput;