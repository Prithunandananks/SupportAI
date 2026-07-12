import { useEffect, useState, useMemo } from "react";
import DocumentRow from "./DocumentRow";
import { adminService } from "@/services/admin.service";
import type { AdminDocument } from "@/services/admin.service";
import { Search } from "lucide-react";

export default function DocumentTable() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchDocuments = () => {
    setLoading(true);
    adminService.getRecentDocuments(100)
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load documents", err);
        setError("Failed to load documents.");
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    await adminService.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const shortType = (doc.content_type || "unknown").split("/").pop()?.toLowerCase();
      const matchesType = typeFilter === "all" || shortType?.includes(typeFilter);
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  if (error) {
    return <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900 mt-8">{error}</div>;
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold">
          Uploaded Documents
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition w-full md:w-64"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="document">Document (Word)</option>
            <option value="txt">TXT</option>
            <option value="plain">Plain Text</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-4 px-4 font-medium text-slate-300">Document</th>
              <th className="pb-4 px-4 font-medium text-slate-300">Type</th>
              <th className="pb-4 px-4 font-medium text-slate-300">Uploaded</th>
              <th className="pb-4 px-4 font-medium text-slate-300">Status</th>
              <th className="pb-4 px-4 font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} className="animate-pulse border-b border-slate-800/50">
                  <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-48"></div></td>
                  <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-24"></div></td>
                  <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded w-20"></div></td>
                  <td className="py-4 px-4"><div className="h-8 bg-slate-800 rounded w-40"></div></td>
                </tr>
              ))
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  id={doc.id}
                  name={doc.filename}
                  type={doc.content_type || "Unknown"}
                  uploaded={new Date(doc.created_at).toLocaleDateString()}
                  onDelete={handleDelete}
                  onReplaceComplete={fetchDocuments}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                      <span className="text-3xl">📄</span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No documents found</h3>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}