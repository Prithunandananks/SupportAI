import AdminLayout from "@/components/admin/layout/AdminLayout";
import FlaggedTable from "@/components/admin/flagged/FlaggedTable";

function FlaggedQuestions() {
  return (
    <AdminLayout title="Flagged Questions">
      <FlaggedTable />
    </AdminLayout>
  );
}

export default FlaggedQuestions;