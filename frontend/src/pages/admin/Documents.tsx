import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";

import UploadBox from "@/components/admin/documents/UploadBox";
import DocumentTable from "@/components/admin/documents/DocumentTable";

import { adminService } from "@/services/admin.service";
import type { DocType } from "@/components/admin/documents/DocumentTable";

function Documents() {
  const [documentsList, setDocumentsList] = useState<DocType[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await adminService.getRecentDocuments(100);
        const mapped: DocType[] = docs.map(d => ({
          id: d.id,
          name: `📄${d.filename}`,
          type: d.content_type.includes("pdf") ? "PDF" : d.content_type.includes("word") ? "DOCX" : "TXT",
          uploadedAt: d.created_at,
          size: d.file_size ? `${(d.file_size / (1024 * 1024)).toFixed(1)} MB` : "Unknown"
        }));
        setDocumentsList(mapped);
      } catch {
        console.error("Failed to load documents");
      }
    };
    fetchDocs();
  }, []);

  const handleUpload = (newDoc: DocType) => {
    setDocumentsList(prev => [newDoc, ...prev]);
  };

  return (
    <AdminLayout title="Knowledge Base">
      <UploadBox onUpload={handleUpload} />
      <DocumentTable documentsList={documentsList} setDocumentsList={setDocumentsList} />
    </AdminLayout>
  );
}

export default Documents;