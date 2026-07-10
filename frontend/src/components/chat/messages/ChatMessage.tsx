import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";

import type { Message } from "./Message";

// Registering common languages for light version to save bundle size
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("markdown", markdown);

interface Props {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
}

const ChatMessage = React.memo(({ message, isLast, onRegenerate }: Props) => {
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    toast.success("Copied to clipboard!");
  };

  const handleLike = () => {
    toast.success("Feedback submitted!");
  };

  const handleDislike = () => {
    toast.error("Feedback submitted!");
  };

  return (
    <div
      className={`flex mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-3xl ${isUser ? "" : "w-full"}`}>

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
          {isUser ? (
            <p className="leading-7 whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-p:leading-7">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} bg-slate-700/50 px-1.5 py-0.5 rounded text-cyan-300`} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Assistant Extras */}
        {!isUser && (
          <>
            {/* Sources section - TODO: replace with real message.sources if backend provides citations */}
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 opacity-70">
                📄 Sources (TODO)
              </span>
            </div>

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
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition hover:text-white flex items-center gap-2"
                  aria-label="Regenerate response"
                  title="Regenerate"
                >
                  <RefreshCw size={16} />
                </button>
              )}

              <button
                onClick={handleLike}
                className="p-2 rounded-lg bg-slate-800 hover:bg-green-900/50 transition hover:text-green-400 ml-auto"
                aria-label="Like response"
                title="Like"
              >
                <ThumbsUp size={16} />
              </button>

              <button
                onClick={handleDislike}
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/50 transition hover:text-red-400"
                aria-label="Dislike response"
                title="Dislike"
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;