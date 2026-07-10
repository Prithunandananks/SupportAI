import React from "react";
import ChatSidebar from "@/components/chat/layout/ChatSidebar";
import ChatHeader from "@/components/chat/layout/ChatHeader";
import WelcomeScreen from "@/components/chat/welcome/WelcomeScreen";
import ChatInput from "@/components/chat/input/ChatInput";
import MessageList from "@/components/chat/messages/MessageList";
import { useChat } from "@/hooks/useChat";

function CustomerChat() {
  const { 
    messages, 
    sendMessage, 
    clearChat, 
    deleteChat,
    renameChat,
    selectSession,
    isTyping, 
    conversations,
    activeSessionId,
    isConversationsLoading,
    isHistoryLoading,
    error,
    cancelStream,
    regenerateMessage
  } = useChat();

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (isTyping) {
          cancelStream();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping, cancelStream]);

  return (
    <div className="bg-slate-950 text-white h-screen flex">
      <ChatSidebar 
        onNewChat={clearChat}
        onSelectChat={selectSession}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        conversations={conversations}
        activeSessionId={activeSessionId}
        isLoading={isConversationsLoading}
      />

      <main className="flex-1 flex flex-col relative">
        <ChatHeader />

        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-4 py-2 text-sm text-center">
            {error}
          </div>
        )}

        {isHistoryLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
        ) : messages.length === 0 ? (
          <WelcomeScreen onQuestionClick={sendMessage} />
        ) : (
          <>
            <MessageList 
              messages={messages} 
              onRegenerate={regenerateMessage}
            />
            {isTyping && (
              <div className="px-10 pb-6 flex">
                <div className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-4 shadow-lg">
                  <p className="text-cyan-400 font-semibold mb-3">
                    🤖 SupportAI
                  </p>
                  <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"></span>
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
          
        <ChatInput 
          onSend={sendMessage} 
          isTyping={isTyping} 
          onStop={cancelStream} 
          inputRef={inputRef} 
        />
      </main>
    </div>
  );
}

export default CustomerChat;