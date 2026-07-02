import AdminLayout from "@/components/admin/layout/AdminLayout";

import SearchBar from "@/components/admin/conversations/SearchBar";
import ConversationTable from "@/components/admin/conversations/ConversationTable";

function Conversations() {
  return (
    <AdminLayout title="Conversations">
      <SearchBar />

      <ConversationTable />
    </AdminLayout>
  );
}

export default Conversations;