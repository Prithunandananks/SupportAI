import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import WelcomeCard from "@/components/customer/dashboard/WelcomeCard";
import QuickActions from "@/components/customer/dashboard/QuickActions";
import RecentChats from "@/components/customer/dashboard/RecentChats";
import PopularTopics from "@/components/customer/dashboard/PopularTopics";
import RecentActivity from "@/components/customer/dashboard/RecentActivity";
import ProfileSummary from "@/components/customer/dashboard/ProfileSummary";
import SuggestedQuestions from "@/components/chat/welcome/SuggestedQuestions";
import { mockAnalyticsData } from "@/pages/admin/mockAnalyticsData";
import { useChat } from "@/hooks/useChatContext";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { sessions, activities } = useChat();

  const recentChats = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 2)
      .map(session => ({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        preview: session.messages.length > 0 
          ? session.messages[session.messages.length - 1].text 
          : "New conversation started.",
      }));
  }, [sessions]);

  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [activities]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestedQuestion = (question: string) => {
    navigate("/chat", { state: { initialQuestion: question, newChat: true } });
  };

  const handleContinueChat = (chatId: string) => {
    navigate("/chat", { state: { activeSessionId: chatId } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 space-y-8 animate-pulse">
            <div className="h-48 bg-slate-900 rounded-2xl border border-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="h-96 bg-slate-900 rounded-2xl border border-slate-800" />
              </div>
              <div className="space-y-8">
                <div className="h-24 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="h-48 bg-slate-900 rounded-2xl border border-slate-800" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 space-y-8">
          
          <WelcomeCard />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <QuickActions />

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Ask SupportAI</h3>
                <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
              </div>

              <RecentChats chats={recentChats} onContinue={handleContinueChat} />
            </div>

            <div className="space-y-8">
              <ProfileSummary />
              <RecentActivity activities={recentActivities} />
              <PopularTopics topics={mockAnalyticsData["30days"].topTopics} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;

