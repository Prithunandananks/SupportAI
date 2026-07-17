import { useState } from "react";

interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, comment?: string) => void;
}

const REASONS = [
  { value: "INCORRECT", label: "Incorrect answer" },
  { value: "OUTDATED", label: "Outdated information" },
  { value: "INCOMPLETE", label: "Incomplete answer" },
  { value: "IRRELEVANT", label: "Irrelevant answer" },
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
        
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Reason</label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label 
                  key={r.value} 
                  className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                    reason === r.value 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="w-4 h-4 text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-600 focus:ring-offset-slate-900"
                  />
                  <span className={`ml-3 text-sm font-medium ${reason === r.value ? 'text-white' : 'text-slate-300'}`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what went wrong so our support team can investigate."
              maxLength={500}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none custom-scrollbar"
            />
            <div className="text-right text-xs text-slate-500">
              {comment.length}/500
            </div>
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
