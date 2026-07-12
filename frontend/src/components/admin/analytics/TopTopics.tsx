import { MessageSquareOff } from "lucide-react";

function TopTopics() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-[400px] flex flex-col">
      <h2 className="text-xl font-semibold mb-6">
        Top Topics
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-700/50">
          <MessageSquareOff size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">Topic modeling inactive</h3>
        <p className="text-sm mt-1 max-w-[200px] text-center">
          Topic extraction is not currently configured for this workspace.
        </p>
      </div>
    </div>
  );
}

export default TopTopics;