import { useAuth } from "@/hooks/useAuthCore";

function WelcomeCard() {
  const { user } = useAuth();
  
  if (!user) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:shadow-cyan-500/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-110" />
      
      <div className="relative z-10">
        <p className="text-cyan-400 font-semibold mb-1 tracking-wide uppercase text-sm">{greeting}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          {user.name}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
          Here is what's happening with your SupportAI account today. You can quickly start a new conversation or pick up where you left off.
        </p>
      </div>
    </div>
  );
}

export default WelcomeCard;

