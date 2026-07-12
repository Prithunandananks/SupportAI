import { useRef, useState } from "react";
import { FileUp, Trash2, RefreshCw } from "lucide-react";
import { documentService } from "@/services/document.service";
import toast from "react-hot-toast";

interface Props {
  id: string;
  name: string;
  type: string;
  uploaded: string;
  onDelete: (id: string) => Promise<void>;
  onReplaceComplete: () => void;
}

export default function DocumentRow({ id, name, type, uploaded, onDelete, onReplaceComplete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
      toast.success("Document deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We do NOT delete the old one until upload succeeds.
    setIsReplacing(true);
    const toastId = toast.loading("Uploading replacement...");
    
    try {
      // 1. Upload new document
      await documentService.uploadDocument(file, () => {});
      
      toast.loading("Deleting old document...", { id: toastId });
      // 2. Delete old document on success
      await onDelete(id);
      
      toast.success("Document replaced successfully!", { id: toastId });
      onReplaceComplete();
    } catch (err) {
      console.error(err);
      toast.error("Failed to replace document. Original preserved.", { id: toastId });
    } finally {
      setIsReplacing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const shortType = type.split("/").pop()?.toUpperCase() || type;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition">
      <td className="py-4 px-4 font-medium max-w-[200px] truncate" title={name}>{name}</td>
      <td className="py-4 px-4">
        <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
          {shortType}
        </span>
      </td>
      <td className="py-4 px-4 text-slate-400">{uploaded}</td>
      <td className="py-4 px-4 text-slate-400">Completed</td>
      <td className="py-4 px-4">
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={handleFileSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isReplacing || isDeleting}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition text-sm disabled:opacity-50"
            title="Replace Document"
          >
            {isReplacing ? <RefreshCw size={16} className="animate-spin" /> : <FileUp size={16} />}
            Replace
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={isReplacing || isDeleting}
            className="flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition text-sm disabled:opacity-50"
            title="Delete Document"
          >
            {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}