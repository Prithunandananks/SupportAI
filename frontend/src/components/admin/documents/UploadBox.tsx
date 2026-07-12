import React, { useRef, useState } from "react";
import { documentService, type UploadResponse } from "@/services/document.service";
import { extractErrorMessage } from "@/utils/errorHandler";

interface Props {
  onUploadSuccess: (doc: UploadResponse) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

function UploadBox({ onUploadSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    setSuccess(null);

    const ext = "." + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, Markdown, or TXT file.");
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const response = await documentService.uploadDocument(file, (p) => {
        setProgress(p);
      });
      
      setSuccess("Upload Complete");
      onUploadSuccess(response);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, "An error occurred during upload."));
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`bg-slate-900 border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
        isDragging ? "border-cyan-400 bg-slate-800" : "border-cyan-500"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <h2 className="text-2xl font-semibold">
        📄 Upload Knowledge Documents
      </h2>

      <p className="text-slate-400 mt-3">
        Drag & drop your PDF, DOCX, Markdown or TXT files here
      </p>

      {error && (
        <div className="mt-4 text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded border border-red-400/20 inline-block">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 text-green-400 text-sm font-medium bg-green-400/10 p-3 rounded border border-green-400/20 inline-block">
          {success}
        </div>
      )}

      {isUploading && (
        <div className="mt-4 text-cyan-400 text-sm font-medium">
          {progress < 100 ? `Uploading... ${progress}%` : "Processing..."}
        </div>
      )}

      <div className="mt-6">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          onChange={handleFileSelect}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-xl transition ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Browse Files
        </button>
      </div>
    </div>
  );
}

export default UploadBox;