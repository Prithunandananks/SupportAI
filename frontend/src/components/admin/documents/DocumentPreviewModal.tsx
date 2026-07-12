import { X } from "lucide-react";
import { formatTimeAgo } from "@/utils/dateFormatter";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  } | null;
}

function DocumentPreviewModal({ isOpen, onClose, document }: Props) {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white break-all pr-4">
            {document.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Type:</span> 
              <span className="text-cyan-400 font-medium">{document.type}</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Size:</span> {document.size}
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Uploaded:</span> {formatTimeAgo(document.uploadedAt)}
            </div>
          </div>

          {/* Placeholder Preview Area */}
          <div className="w-full bg-slate-950 rounded-xl border border-slate-800 min-h-[300px] md:min-h-[400px] flex items-center justify-center text-slate-500">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">📄</div>
              <p>Document preview is not available in the current backend.</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default DocumentPreviewModal;
