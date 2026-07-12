import DashboardCard from "./DashboardCard";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/hooks/useAuthCore";

function ProfileSummary() {
  const { user } = useAuth();
  
  if (!user) return null;
  return (
    <DashboardCard className="flex items-center gap-4">
      <ProfileAvatar name={user.name} size={64} />
      <div>
        <h3 className="text-lg font-bold text-white mb-0.5">{user.name}</h3>
        <p className="text-sm text-slate-400 mb-1">{user.email}</p>
        <p className="text-xs text-slate-500 font-medium">Last active just now</p>
      </div>
    </DashboardCard>
  );
}

export default ProfileSummary;

