import { useState } from "react";
import { X, CheckCircle, RotateCcw } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

interface QuestionData {
  question: string;
  confidence: number;
  status: "Pending" | "Resolved";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
  onReopen: () => void;
  data: QuestionData | null;
}

function ReviewModal({ isOpen, onClose, onResolve, onReopen, data }: Props) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isOpen || !data) return null;

  const isPending = data.status === "Pending";
  
  const confirmTitle = isPending ? "Confirm Resolution" : "Reopen Question";
  const confirmMessage = isPending 
    ? "Are you sure you want to mark this flagged question as Resolved?" 
    : "Are you sure you want to move this question back to Pending for further review?";

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    if (isPending) {
      onResolve();
    } else {
      onReopen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            Review Flagged Question
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          
          <div>
            <label className="text-slate-400 text-sm block mb-1">Customer Question</label>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-medium">
              "{data.question}"
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <label className="text-slate-400 text-sm block mb-1">Current Status</label>
              <StatusBadge status={data.status} />
            </div>
            
            <div>
              <label className="text-slate-400 text-sm block mb-1">AI Confidence</label>
              <span
                className={`text-lg font-semibold ${
                  data.confidence < 60 ? "text-red-400" : "text-green-400"
                }`}
              >
                {data.confidence}%
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Suggested AI Answer (Mock)</label>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm">
              <p>Based on our documentation, here is the suggested response:</p>
              <p className="mt-2 text-cyan-400">Please review the specific policy document related to this inquiry for accurate instructions.</p>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Review Notes</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm outline-none resize-none cursor-not-allowed"
              rows={3}
              placeholder="Admin notes (Read-only mock)"
              disabled
            ></textarea>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition text-sm"
          >
            Close
          </button>
          
          {isPending ? (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition flex items-center gap-2 text-sm"
            >
              <CheckCircle size={18} />
              Mark as Resolved
            </button>
          ) : (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="px-6 py-2 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 rounded-lg font-medium transition flex items-center gap-2 text-sm"
            >
              <RotateCcw size={18} />
              Reopen Question
            </button>
          )}
        </div>

      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        message={confirmMessage}
      />
    </div>
  );
}

export default ReviewModal;
