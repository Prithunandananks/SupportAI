import AdminLayout from "@/components/admin/layout/AdminLayout";
import UploadBox from "@/components/admin/documents/UploadBox";
import DocumentTable from "@/components/admin/documents/DocumentTable";

function Documents() {
  const handleUploadSuccess = () => {
    // Optionally trigger a re-fetch in DocumentTable using a global event or context.
    // For now, page refresh or component remount gets the latest.
    window.location.reload();
  };

  return (
    <AdminLayout title="Knowledge Base">
      <UploadBox onUploadSuccess={handleUploadSuccess} />
      <DocumentTable />
    </AdminLayout>
  );
}

export default Documents;