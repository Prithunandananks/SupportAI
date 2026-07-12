import { useState } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";

import UploadBox from "@/components/admin/documents/UploadBox";
import DocumentTable from "@/components/admin/documents/DocumentTable";

const now = new Date();

const todayMorning = new Date(now);
todayMorning.setHours(9, 30, 0, 0);
if (todayMorning > now) {
  todayMorning.setDate(todayMorning.getDate() - 1);
}

const yesterdayAfternoon = new Date(now);
yesterdayAfternoon.setDate(yesterdayAfternoon.getDate() - 1);
yesterdayAfternoon.setHours(14, 15, 0, 0);

const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
twoDaysAgo.setHours(11, 45, 0, 0);

const initialDocuments = [
  {
    id: "doc-1",
    name: "📄Employee_Handbook.pdf",
    type: "PDF",
    uploadedAt: todayMorning.toISOString(),
    size: "2.4 MB",
  },
  {
    id: "doc-2",
    name: "📄Refund_Policy.pdf",
    type: "PDF",
    uploadedAt: yesterdayAfternoon.toISOString(),
    size: "1.1 MB",
  },
  {
    id: "doc-3",
    name: "📄HR_Guide.pdf",
    type: "PDF",
    uploadedAt: twoDaysAgo.toISOString(),
    size: "3.5 MB",
  },
];

function Documents() {
  const [documentsList, setDocumentsList] = useState(initialDocuments);

  const handleUpload = (newDoc: typeof initialDocuments[0]) => {
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