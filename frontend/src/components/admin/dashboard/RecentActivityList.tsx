import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import type { AdminDocument } from "@/services/admin.service";

export default function RecentActivityList() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getRecentDocuments(3)
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load recent activity", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse h-[100px] bg-slate-800 rounded"></div>;
  }

  if (documents.length === 0) {
    return <div className="text-slate-400">No recent activity.</div>;
  }

  return (
    <>
      {documents.map((doc, i) => (
        <div key={doc.id} className={`border-l-4 pl-4 ${i === 0 ? 'border-cyan-500' : i === 1 ? 'border-yellow-500' : 'border-green-500'}`}>
          <p className="font-medium">
            {doc.filename} uploaded
          </p>
          <span className="text-slate-400 text-sm">
            {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </>
  );
}
