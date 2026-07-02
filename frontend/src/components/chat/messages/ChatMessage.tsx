import type { Message } from "./Message";

interface Props {
  message: Message;
}

function ChatMessage({ message }: Props) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className="max-w-3xl">

        {/* Sender */}
        <p
          className={`text-sm mb-2 font-semibold flex items-center gap-2 ${
            isUser
              ? "justify-end text-cyan-400"
              : "text-cyan-400"
          }`}
        >
          {isUser ? "You" : "🤖 SupportAI"}
        </p>

        {/* Bubble */}
        <div
          className={`rounded-3xl px-6 py-4 shadow-lg transition-all duration-300 ${
            isUser
              ? "bg-cyan-500 text-white hover:bg-cyan-400"
              : "bg-slate-800 text-white border border-slate-700 hover:border-cyan-500"
          }`}
        >
          <p className="leading-7 whitespace-pre-wrap">
            {message.text}
          </p>
        </div>

        {/* Assistant Extras */}
        {!isUser && (
          <>
            <div className="flex flex-wrap gap-3 mt-4">

              <span className="bg-green-900/60 text-green-300 px-3 py-1 rounded-full text-sm">
                🟢 96% Confidence
              </span>

              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">
                📄 Employee_Handbook.pdf
              </span>

            </div>

            <div className="flex gap-4 mt-4">

              <button
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-slate-800
                  hover:bg-green-700
                  transition-all
                  duration-300
                  hover:scale-110
                "
              >
                👍︎
              </button>

              <button
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-slate-800
                  hover:bg-red-700
                  transition-all
                  duration-300
                  hover:scale-110
                "
              >
                👎︎
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;