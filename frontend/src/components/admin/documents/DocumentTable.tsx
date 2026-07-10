import { useEffect, useState } from "react";
import DocumentRow from "./DocumentRow";
import { adminService } from "@/services/admin.service";
import type { AdminDocument } from "@/services/admin.service";

function DocumentTable() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getRecentDocuments(10)
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load documents", err);
        setError("Failed to load documents.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-8 h-[400px] animate-pulse">
        <h2 className="text-2xl font-semibold mb-6">Uploaded Documents</h2>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-800 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900 mt-8">{error}</div>;
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-6">
        Uploaded Documents
      </h2>
      
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="pb-4">Document</th>
            <th className="pb-4">Type</th>
            <th className="pb-4">Uploaded</th>
            <th className="pb-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              name={doc.filename}
              type={doc.content_type || "Unknown"}
              uploaded={new Date(doc.created_at).toLocaleDateString()}
            />
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12">
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">No documents yet</h3>
                  <p className="text-sm mt-1">Upload your first document to enhance the AI.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;