import {
  ArrowLeft,
  Bell,
  Moon,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";

function CustomerSettingsCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const roleDisplay = user.role === "admin" ? "Administrator" : "Customer";

  return (
    <div className="w-full max-w-2xl">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="
          flex
          items-center
          gap-2
          mb-6
          text-slate-400
          hover:text-cyan-400
          transition
        "
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div
        className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          md:p-8
        "
      >

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white">
          Settings
        </h1>

        <p className="text-slate-400 mt-2 mb-8">
          Manage your account preferences and application settings.
        </p>

        {/* ================= Account ================= */}

        <div className="mb-8">

          <div className="flex items-center gap-3 mb-5 text-white">

            <User
              size={20}
              className="text-cyan-400"
            />

            <h2 className="text-lg font-semibold">
              Account
            </h2>

          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-slate-400">
                Name
              </span>

              <span className="text-white font-medium">
                {user.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Email
              </span>

              <span className="text-white font-medium">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Role
              </span>

              <span className="text-white font-medium">
                {roleDisplay}
              </span>
            </div>

          </div>

        </div>

        <div className="border-t border-slate-800 my-8" />

        {/* ================= Notifications ================= */}

        <div className="mb-8">

          <div className="flex items-center gap-3 mb-5 text-white">

            <Bell
              size={20}
              className="text-cyan-400"
            />

            <h2 className="text-lg font-semibold">
              Notifications
            </h2>

          </div>

          <label className="flex items-center gap-3 text-white cursor-pointer">

            <input
              type="checkbox"
              checked
              readOnly
              className="accent-cyan-500"
            />

            Email Notifications

          </label>

        </div>

        <div className="border-t border-slate-800 my-8" />

        {/* ================= Appearance ================= */}

        <div className="mb-8">

          <div className="flex items-center gap-3 mb-5 text-white">

            <Moon
              size={20}
              className="text-cyan-400"
            />

            <h2 className="text-lg font-semibold">
              Appearance
            </h2>

          </div>

          <div className="flex justify-between">

            <span className="text-slate-400">
              Theme
            </span>

            <span className="text-white font-medium">
              Dark Mode
            </span>

          </div>

        </div>

        <div className="border-t border-slate-800 pt-8">

          <h2 className="text-lg font-semibold text-white mb-3">
            About
          </h2>

          <p className="text-slate-300">
            SupportAI v1.0
          </p>

          <p className="text-slate-500 text-sm mt-2">
            AI-powered Customer Support Platform
          </p>

        </div>

      </div>

    </div>
  );
}

export default CustomerSettingsCard;