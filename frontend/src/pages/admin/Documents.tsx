import AdminLayout from "@/components/admin/layout/AdminLayout";

import UploadBox from "@/components/admin/documents/UploadBox";
import DocumentTable from "@/components/admin/documents/DocumentTable";

function Documents() {
  return (
    <AdminLayout title="Knowledge Base">

      <UploadBox />

      <DocumentTable />

    </AdminLayout>
  );
}

export default Documents;