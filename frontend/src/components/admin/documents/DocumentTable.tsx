import { useState } from "react";
import { toast } from "sonner";
import { FileWarning } from "lucide-react";
import DocumentRow from "./DocumentRow";
import DocumentPreviewModal from "./DocumentPreviewModal";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { formatTimeAgo } from "@/utils/dateFormatter";
import { adminService } from "@/services/admin.service";

export interface DocType {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

interface Props {
  documentsList: DocType[];
  setDocumentsList: React.Dispatch<React.SetStateAction<DocType[]>>;
}

function DocumentTable({ documentsList, setDocumentsList }: Props) {
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocType | null>(null);

  const openPreview = (doc: DocType) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const confirmDelete = (doc: DocType) => {
    setDocToDelete(doc);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (docToDelete) {
      try {
        await adminService.deleteDocument(docToDelete.id);
        setDocumentsList(prev => prev.filter(d => d.id !== docToDelete.id));
        toast.success("Document deleted successfully.");
      } catch {
        toast.error("Failed to delete document.");
      } finally {
        setIsDeleteConfirmOpen(false);
        setDocToDelete(null);
      }
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl md:rounded-2xl border border-slate-800 p-4 md:p-6 mt-6 md:mt-8">

      <h2 className="text-lg md:text-2xl font-semibold mb-5">
        Uploaded Documents
      </h2>

      {documentsList.length === 0 ? (
        <div className="py-12 md:py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-800 p-4 rounded-full mb-4">
            <FileWarning size={40} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No documents available</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Upload your first knowledge document to get started.
          </p>
        </div>
      ) : (
        <>
          {/* ================= Desktop Table ================= */}

          <div className="hidden md:block overflow-x-auto">

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

            {documentsList.map((doc) => (
              <DocumentRow
                key={doc.id}
                name={doc.name}
                type={doc.type}
                uploaded={formatTimeAgo(doc.uploadedAt)}
                onView={() => openPreview(doc)}
                onDelete={() => confirmDelete(doc)}
              />
            ))}

          </tbody>

        </table>

      </div>

      {/* ================= Mobile Cards ================= */}

      <div className="space-y-4 md:hidden">

        {documentsList.map((doc) => (

          <div
            key={doc.id}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4"
          >

            <h3 className="font-medium text-sm text-white break-all">
              {doc.name}
            </h3>

            <div className="mt-3 flex justify-between text-sm">

              <span className="text-slate-400">
                Type
              </span>

              <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full text-xs">
                {doc.type}
              </span>

            </div>

            <div className="mt-2 flex justify-between text-sm">

              <span className="text-slate-400">
                Uploaded
              </span>

              <span>
                {formatTimeAgo(doc.uploadedAt)}
              </span>

            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openPreview(doc)}
                className="
                  flex-1
                  rounded-lg
                  bg-slate-700
                  py-2
                  text-sm
                  text-white
                  hover:bg-slate-600
                  transition
                "
              >
                View
              </button>
              <button
                onClick={() => confirmDelete(doc)}
                className="
                  flex-1
                  rounded-lg
                  bg-red-500
                  py-2
                  text-sm
                  text-white
                  hover:bg-red-600
                  transition
                "
              >
                Delete
              </button>
            </div>

          </div>

        ))}

      </div>
      </>
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete this document?\n\nThis action cannot be undone.`}
        confirmText="Delete"
      />

      <DocumentPreviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        document={selectedDoc}
      />
    </div>
  );
}

export default DocumentTable;