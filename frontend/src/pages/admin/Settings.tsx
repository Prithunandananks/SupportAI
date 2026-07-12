import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminSettingsCard from "@/components/settings/AdminSettingsCard";

function Settings() {
  return (
    <AdminLayout title="Settings">
      <AdminSettingsCard />
    </AdminLayout>
  );
}

export default Settings;