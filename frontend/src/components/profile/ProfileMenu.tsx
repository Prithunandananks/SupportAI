import { useState } from "react";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";
import LogoutConfirmationModal from "@/components/shared/LogoutConfirmationModal";
import { useAuth } from "@/store/AuthContext";

function ProfileMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  if (!user) return null;

  return (
    <div className="relative">

      {/* Avatar Button */}
<button
  onClick={() => setOpen(!open)}
  className="
    flex
    items-center
    gap-2
    h-11
    w-20
    rounded-xl
    border
    border-slate-700
    bg-slate-900
    px-3
    hover:border-cyan-500
    hover:bg-slate-800
    transition-all
    duration-300
  "
>
  <ProfileAvatar
    name={user.name}
    size={34}
  />

  <ChevronDown
    size={16}
    className={`transition-transform duration-300  text-white ${
      open ? "rotate-180" : ""
    }`}
  />
</button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div
            className="
              absolute
              right-0
              mt-3
              w-72
              rounded-2xl
              border
              border-slate-700
              bg-slate-900
              shadow-xl
              z-50
              overflow-hidden
            "
          >
            {/* User Info */}
            <div className="flex items-center gap-4 p-5">

              <ProfileAvatar
                name={user.name}
                size={50}
              />

              <div>
                <h3 className="font-semibold text-white">
                  {user.name}
                </h3>

                <p className="text-sm text-slate-400">
                  {user.email}
                </p>
              </div>

            </div>

            <div className="border-t border-slate-800" />

            {/* Menu */}
            <button
              onClick={() => {
                navigate(user.role === "admin" ? "/admin/profile" : "/profile");
                setOpen(false);
              }}
              className="
  flex
  items-center
  gap-3
  w-full
  px-5
  py-3
  text-slate-200
  hover:bg-slate-800
  hover:text-cyan-400
  transition
"
            >
              <User size={18} />
              My Profile
            </button>

            <button
  onClick={() => {
    navigate(user.role === "admin" ? "/admin/settings" : "/settings");
    setOpen(false);
  }}
  className="
    flex
    items-center
    gap-3
    w-full
    px-5
    py-3
    hover:bg-slate-800
    transition
    text-white
  "
>
  <Settings size={18} />
  Settings
</button>

            <div className="border-t border-slate-800" />

            <button
              onClick={() => {
                setOpen(false);
                setIsLogoutModalOpen(true);
              }}
  className="
    flex
    items-center
    gap-3
    w-full
    px-5
    py-3
    text-red-400
    hover:bg-red-500/10
    transition
  "
>
  <LogOut size={18} />
  Logout
</button>

          </div>
        </>
      )}

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          navigate("/", { replace: true, state: {} });
          setIsLogoutModalOpen(false);
        }}
      />
    </div>
  );
}

export default ProfileMenu;