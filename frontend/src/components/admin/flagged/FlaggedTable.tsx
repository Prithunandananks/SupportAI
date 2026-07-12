import { AlertTriangle } from "lucide-react";

function FlaggedTable() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Flagged Questions
      </h2>

      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-700/50">
          <AlertTriangle size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">No flagged questions</h3>
        <p className="text-sm mt-1 max-w-sm text-center">
          The AI hasn't flagged any low-confidence or problematic interactions yet.
        </p>
      </div>
    </div>
  );
}

export default FlaggedTable;