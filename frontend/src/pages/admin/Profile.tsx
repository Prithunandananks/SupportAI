import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminProfileCard from "@/components/profile/AdminProfileCard";

function Profile() {
  return (
    <AdminLayout title="Profile">
      <AdminProfileCard />
    </AdminLayout>
  );
}

export default Profile;