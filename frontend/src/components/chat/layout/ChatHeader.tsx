import { House } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ChatHeader() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-800 p-6 flex items-center justify-between">

      <div>
        <h1 className="text-2xl font-bold text-cyan-400">
          🤖 SupportAI
        </h1>

        <p className="text-slate-400 mt-1">
          AI Customer Support Assistant
        </p>
      </div>

      <button
        onClick={() => navigate("/")}
        className="
          flex
          items-center
          gap-2
          border border-slate-700
          bg-slate-900
          hover:border-cyan-500
          hover:shadow-lg
          hover:shadow-cyan-500/10
          hover:bg-cyan-500
          px-5
          py-3
          rounded-xl
          transition-all
          duration-300
        "
      >
        <House size={18} />
        Home
      </button>

    </header>
  );
}

export default ChatHeader;