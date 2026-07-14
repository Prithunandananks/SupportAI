import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import type { Message } from "./Message";
import { formatTimeAgo } from "@/utils/dateFormatter";

interface Props {
  message: Message;
  onFeedback?: (
    messageId: string | number,
    feedback: "like" | "dislike",
  ) => void;
  onFlag?: (messageId: string | number) => void;
}

function ChatMessage({ message, onFeedback, onFlag }: Props) {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const getRetrievalBadge = (confidence?: number | null) => {
    if (confidence === undefined || confidence === null)
      return { label: "No Data", color: "bg-slate-800 text-slate-400" };
    if (confidence >= 80)
      return {
        label: "High Retrieval Score",
        color: "bg-green-900/60 text-green-300",
      };
    if (confidence >= 50)
      return {
        label: "Medium Retrieval Score",
        color: "bg-yellow-900/60 text-yellow-300",
      };
    return {
      label: "Low Retrieval Score",
      color: "bg-red-900/60 text-red-300",
    };
  };

  const retrievalBadge = getRetrievalBadge(message.confidence);

  return (
    <div
      className={`flex mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[85%] md:max-w-[80%]">
        {/* Sender & Timestamp */}
        <p
          className={`text-[11px] tracking-wide md:text-sm mb-2 font-semibold flex items-center gap-2 ${isUser ? "justify-end text-cyan-400" : "text-cyan-400"}`}
        >
          {isUser ? "You" : "SupportAI"}
          {message.createdAt && (
            <span className="text-slate-500 font-normal text-[10px] md:text-xs">
              • {formatTimeAgo(message.createdAt)}
            </span>
          )}
        </p>

        {/* Bubble */}
        <div
          className={`rounded-2xl md:rounded-3xl px-4 md:px-5 py-3 md:py-4 shadow-lg transition-all duration-300 relative ${isUser ? "bg-cyan-500 text-white hover:bg-cyan-400" : "bg-slate-800 text-white border border-slate-700 hover:border-cyan-500"}`}
        >
          <p className="text-sm md:text-base leading-6 md:leading-7 whitespace-pre-wrap">
            {message.text}
          </p>
        </div>

        {/* Assistant Extras */}
        {!isUser && (
          <>
            <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
              {retrievalBadge && (
                <span
                  className={`${retrievalBadge.color} px-3 md:px-4 py-1 rounded-full text-xs md:text-sm flex items-center gap-1 font-medium`}
                >
                  {retrievalBadge.label}{" "}
                  {message.confidence != null && (
                    <span className="opacity-75 text-[10px] md:text-xs ml-1">
                      {message.confidence}%
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="flex gap-2 mt-3 md:mt-4">
              <button
                onClick={handleCopy}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-300"
                title="Copy Response"
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>

              <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

              <button
                onClick={() => onFeedback?.(message.id, "like")}
                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-300 ${message.feedback === "like" ? "bg-green-900/50 text-green-400 border border-green-800/50" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}
                title="Helpful"
              >
                <ThumbsUp
                  size={14}
                  className={
                    message.feedback === "like" ? "fill-green-400/20" : ""
                  }
                />
              </button>

              <button
                onClick={() => onFeedback?.(message.id, "dislike")}
                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-300 ${message.feedback === "dislike" ? "bg-red-900/50 text-red-400 border border-red-800/50" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}
                title="Not Helpful"
              >
                <ThumbsDown
                  size={14}
                  className={
                    message.feedback === "dislike" ? "fill-red-400/20" : ""
                  }
                />
              </button>

              <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

              <button
                onClick={() => !message.flagged && onFlag?.(message.id)}
                disabled={message.flagged}
                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-300 ${message.flagged ? "bg-orange-900/20 text-orange-400/50 cursor-not-allowed border border-orange-900/30" : "bg-slate-800 text-slate-400 hover:text-orange-400 hover:bg-orange-900/20"}`}
                title={message.flagged ? "Reported" : "Report Response"}
              >
                <Flag
                  size={14}
                  className={message.flagged ? "fill-orange-400/20" : ""}
                />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
