import ChatSidebar from "@/components/chat/layout/ChatSidebar";
import ChatHeader from "@/components/chat/layout/ChatHeader";
import WelcomeScreen from "@/components/chat/welcome/WelcomeScreen";
import ChatInput from "@/components/chat/input/ChatInput";
import MessageList from "@/components/chat/messages/MessageList";
import { useChat } from "@/hooks/useChat";

function CustomerChat() {
  const { messages, sendMessage, clearChat, isTyping, conversations } = useChat();

  return (
    <div className="bg-slate-950 text-white h-screen flex">
      <ChatSidebar onNewChat={clearChat}
        conversations={conversations}
         />

      <main className="flex-1 flex flex-col">
        <ChatHeader />

        {messages.length === 0 ? (
          <WelcomeScreen  onQuestionClick={sendMessage} />
        ) : (
          <>
            <MessageList messages={messages} />
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
          
        <ChatInput onSend={sendMessage} />
      </main>
    </div>
  );
}

export default CustomerChat;