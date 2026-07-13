import { useState } from "react";

interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, comment?: string) => void;
}

const REASONS = [
  { value: "INCORRECT", label: "Incorrect answer" },
  { value: "HALLUCINATION", label: "Hallucination" },
  { value: "INCOMPLETE", label: "Incomplete answer" },
  { value: "OFFENSIVE", label: "Offensive content" },
  { value: "OTHER", label: "Other" }
];

function ReportMessageModal({ isOpen, onClose, onSubmit }: ReportMessageModalProps) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason, comment);
    setReason(REASONS[0].value);
    setComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-5 md:p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            Report AI Response
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            This response will be marked for administrator review.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
            >
              {REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide more details..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none custom-scrollbar"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-2.5 text-sm font-medium transition shadow-lg shadow-orange-900/20"
            >
              Submit Report
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ReportMessageModal;
