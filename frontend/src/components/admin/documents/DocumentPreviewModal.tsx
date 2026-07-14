/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { X, Download, FileWarning } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { formatTimeAgo } from "@/utils/dateFormatter";
import { adminService } from "@/services/admin.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  } | null;
}

function DocumentPreviewModal({ isOpen, onClose, document }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<number | false>(false);
  const [contentStr, setContentStr] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      if (!isOpen || !document) return;

      // Reset states
      setIsLoading(true);
      setError(false);
      setContentStr(null);
      
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }

      // If it's DOCX or unsupported, don't even fetch
      if (document.type !== "MD" && document.type !== "TXT" && document.type !== "PDF") {
        setIsLoading(false);
        return;
      }

      try {
        const blob = await adminService.getDocumentPreview(document.id);
        if (!active) return;

        if (document.type === "MD" || document.type === "TXT") {
          const text = await blob.text();
          setContentStr(text);
        } else if (document.type === "PDF") {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.response?.status === 404 ? 404 : 500);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document]); // Intentional: we manage blobUrl inside useEffect

  if (!isOpen || !document) return null;

  const handleDownload = async () => {
    try {
      const cleanName = document.name.replace(/^📄\s*/, '');
      toast.info(`Downloading ${cleanName}...`);
      await adminService.downloadDocument(document.id, cleanName);
    } catch {
      toast.error("Failed to download document.");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4 p-4 border border-slate-800 rounded-xl bg-slate-950 mt-4">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
          <div className="h-4 bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-4/5"></div>
        </div>
      );
    }

    if (error) {
      if (error === 404) {
        return (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-950 rounded-xl border border-slate-800 h-[400px] mt-4">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
              <FileWarning size={40} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">This file is no longer available.</h3>
            <p className="text-slate-400 max-w-sm">
              The original file may have been removed from storage.
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-950 rounded-xl border border-slate-800 h-[400px] mt-4">
          <div className="bg-slate-800 p-4 rounded-full mb-4">
            <FileWarning size={40} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Unable to preview this document.</h3>
          <p className="text-slate-400 max-w-sm mb-6">
            An error occurred while loading the document preview.
            You can still download the original document.
          </p>
          <button onClick={handleDownload} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
            <Download size={18} />
            Download Document
          </button>
        </div>
      );
    }

    if (document.type === "MD" && contentStr !== null) {
      return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mt-4 overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-white" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 text-slate-300" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-slate-300" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-slate-300" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-4 bg-slate-900 py-2" {...props} />,
              code: ({node, inline, className, children, ...props}: any) => {
                return inline ? (
                  <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-cyan-300" {...props}>{children}</code>
                ) : (
                  <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto mb-4 border border-slate-800 text-sm text-slate-300">
                    <code {...props}>{children}</code>
                  </pre>
                )
              },
              table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="w-full text-left border-collapse" {...props} /></div>,
              th: ({node, ...props}) => <th className="border-b border-slate-700 py-2 px-4 font-semibold text-white bg-slate-800" {...props} />,
              td: ({node, ...props}) => <td className="border-b border-slate-800 py-2 px-4 text-slate-300" {...props} />
            }}
          >
            {contentStr}
          </ReactMarkdown>
        </div>
      );
    }

    if (document.type === "TXT" && contentStr !== null) {
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 bg-slate-950 p-6 rounded-xl border border-slate-800 overflow-x-auto mt-4">
          {contentStr}
        </pre>
      );
    }

    if (document.type === "PDF" && blobUrl !== null) {
      return (
        <div className="mt-4 w-full h-[60vh] md:h-[70vh] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <iframe src={blobUrl} className="w-full h-full" title="PDF Preview" />
        </div>
      );
    }

    // Fallback empty state for DOCX or unsupported
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-950 rounded-xl border border-slate-800 h-[400px] mt-4">
        <div className="bg-slate-800 p-4 rounded-full mb-4">
          <FileWarning size={40} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Preview is currently unavailable.</h3>
        <p className="text-slate-400 max-w-sm mb-6">
          This document type cannot currently be rendered inside the browser.
          You can still download the original document.
        </p>
        <button onClick={handleDownload} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
          <Download size={18} />
          Download Document
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white break-all pr-4">
            {document.name.replace(/^📄\s*/, '')}
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
          <div className="flex flex-wrap gap-4 text-sm">
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
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Chunks:</span> —
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Model:</span> —
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-slate-500 mr-2">Index Status:</span> —
            </div>
          </div>

          {/* Dynamic Preview Area */}
          {renderContent()}
        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={handleDownload}
            className="px-5 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
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
