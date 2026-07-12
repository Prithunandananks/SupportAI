import AdminLayout from "@/components/admin/layout/AdminLayout";
import ConversationTable from "@/components/admin/conversations/ConversationTable";

function Conversations() {
  return (
    <AdminLayout title="Conversations">
      <ConversationTable />
    </AdminLayout>
  );
}

export default Conversations;