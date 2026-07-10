import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  title: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  title,
  isOpen,
  onConfirm,
  onCancel
}: DeleteConfirmationDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex items-center space-x-3 text-red-400 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 id="dialog-title" className="text-lg font-semibold text-slate-100">Delete Conversation</h2>
        </div>
        
        <p className="text-sm text-slate-300 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-100">"{title}"</span>? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
