import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <p className="text-slate-300 text-sm md:text-base whitespace-pre-line">
            {message}
          </p>
        </div>
        
        <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
