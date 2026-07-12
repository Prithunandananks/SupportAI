import React from "react";
import { Copy, RefreshCw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import type { Message } from "./Message";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Props {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
  error?: string;
  isRegenerating?: boolean;
}

const ChatMessage = React.memo(({ message, isLast, onRegenerate, error, isRegenerating }: Props) => {
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    toast.success("Copied to clipboard!");
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());

  return (
    <div
      className={`flex mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-3xl ${isUser ? "" : "w-full"}`}>
        {/* Sender and Timestamp */}
        <div
          className={`flex items-center gap-3 mb-2 ${
            isUser ? "justify-end flex-row-reverse" : "justify-start"
          }`}
        >
          <p className={`text-sm font-semibold ${isUser ? "text-cyan-400" : "text-cyan-400"}`}>
            {isUser ? "You" : "🤖 SupportAI"}
          </p>
          <span className="text-xs text-slate-500 font-medium">
            {message.timestamp ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(message.timestamp)) : formattedTime}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded-3xl px-6 py-4 shadow-lg transition-all duration-300 ${
            isUser
              ? "bg-cyan-500 text-white hover:bg-cyan-400"
              : error
              ? "bg-red-900/20 text-white border border-red-900"
              : "bg-slate-800 text-white border border-slate-700 hover:border-cyan-500"
          }`}
        >
          {isUser ? (
            <p className="leading-7 whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="w-full">
              {message.text ? (
                 <MarkdownRenderer content={message.text} />
              ) : error ? (
                 <p className="text-red-400 leading-7">Generation failed. Please try again.</p>
              ) : (
                 <p className="text-slate-400 italic animate-pulse">Thinking...</p>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && !isUser && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm bg-red-900/10 px-4 py-2 rounded-lg border border-red-900/50">
            <AlertCircle size={16} />
            <span>{error}</span>
            {isLast && onRegenerate && (
               <button 
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="ml-auto underline font-medium hover:text-red-300 disabled:opacity-50"
               >
                 Retry
               </button>
            )}
          </div>
        )}

        {/* Confidence and Sources */}
        {!isUser && !error && message.text && (message.confidence || (message.sources && message.sources.length > 0)) && (
          <div className="mt-3 flex flex-col gap-2">
            {message.confidence && (
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-slate-400">Confidence:</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  message.confidence === "High" ? "bg-green-500/20 text-green-400" :
                  message.confidence === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {message.confidence}
                </span>
              </div>
            )}
            
            {message.sources && message.sources.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Sources</h4>
                <ul className="flex flex-col gap-1">
                  {message.sources.map((src: { filename: string }, idx: number) => (
                    <li key={idx} className="text-xs text-cyan-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                      {src.filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Assistant Extras */}
        {!isUser && !error && message.text && (
          <>
            <div className="flex gap-2 mt-4 items-center text-slate-400">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition hover:text-white"
                aria-label="Copy message"
                title="Copy"
              >
                <Copy size={16} />
              </button>

              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition hover:text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Regenerate response"
                  title="Regenerate"
                >
                  <RefreshCw size={16} className={isRegenerating ? "animate-spin text-cyan-400" : ""} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;