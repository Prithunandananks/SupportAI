import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, File } from "lucide-react";
import type { DocType } from "./DocumentTable";
import { adminService } from "@/services/admin.service";
import type { AxiosProgressEvent } from "axios";

interface Props {
  onUpload?: (doc: DocType) => void;
}

function UploadBox({ onUpload }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const fileToUpload = selectedFile;

    setIsUploading(true);
    setProgress(0);

    try {
      const result = await adminService.uploadDocument(
        fileToUpload,
        (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setProgress(percentCompleted);
          }
        },
      );

      // Determine document type safely
      const ext = fileToUpload.name.split('.').pop()?.toLowerCase();
      let documentType: DocType["type"] = "FILE";
      if (ext === "pdf") documentType = "PDF";
      else if (ext === "docx") documentType = "DOCX";
      else if (ext === "txt") documentType = "TXT";
      else if (ext === "md") documentType = "MD";
      else if (ext) documentType = ext.toUpperCase();

      if (onUpload) {
        onUpload({
          id: result.id,
          name: `📄${result.filename}`,
          type: documentType,
          uploadedAt: result.created_at,
          size: `${(result.file_size / (1024 * 1024)).toFixed(1)} MB`,
        });
      }

      toast.success("Document uploaded successfully!");

      setSelectedFile(null);
      setProgress(0);
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document.");
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div
      className="
        bg-slate-900
        border-2
        border-dashed
        border-cyan-500
        rounded-xl
        md:rounded-2xl
        p-4 md:p-10
        text-center
      "
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.md"
      />

      <h2 className="text-base md:text-2xl font-semibold text-white">
        📄 Upload Knowledge Documents
      </h2>

      {!selectedFile && !isUploading && (
        <>
          <p className="text-slate-400 text-sm md:text-base mt-2 md:mt-3">
            Drag & drop your PDF, DOCX, TXT or MD files here
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              mt-4
              md:mt-6
              bg-cyan-500
              hover:bg-cyan-600
              px-5
              md:px-6
              py-2.5
              md:py-3
              rounded-xl
              text-sm
              md:text-base
              transition
              text-white
            "
          >
            Browse Files
          </button>
        </>
      )}

      {selectedFile && !isUploading && (
        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 text-cyan-400 mb-4 bg-cyan-500/10 px-4 py-2 rounded-lg max-w-full overflow-hidden">
            <File size={20} className="shrink-0" />
            <span className="text-sm font-medium truncate">
              {selectedFile.name}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition text-sm flex items-center gap-2"
            >
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-6 w-full max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 truncate pr-4">
              Uploading {selectedFile?.name}...
            </span>
            <span className="text-cyan-400 font-medium shrink-0">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <button
            disabled
            className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 cursor-not-allowed text-sm md:text-base"
          >
            Uploading...
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadBox;
