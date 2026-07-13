import { useNavigate } from "react-router-dom";
import { MessageSquarePlus, Settings, Ticket } from "lucide-react";
import { toast } from "sonner";

function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (route: string) => {
    if (route === "/chat") {
      navigate(route, { state: { newChat: true } });
    } else if (route === "/settings") {
      navigate(route);
    } else if (route === "/tickets") {
      navigate(route);
    } else {
      toast.info("This feature will be available after backend integration.");
    }
  };

  const actions = [
    { title: "Start New Chat", icon: MessageSquarePlus, route: "/chat", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { title: "Support Tickets", icon: Ticket, route: "/tickets", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { title: "Account Settings", icon: Settings, route: "/settings", color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => handleAction(action.route)}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-lg group text-left w-full"
        >
          <div className={`w-12 h-12 rounded-xl ${action.bg} ${action.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0`}>
            <action.icon size={24} />
          </div>
          <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{action.title}</span>
        </button>
      ))}
    </div>
  );
}

export default QuickActions;
