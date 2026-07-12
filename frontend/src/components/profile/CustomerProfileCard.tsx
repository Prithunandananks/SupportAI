import ProfileAvatar from "./ProfileAvatar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";

function CustomerProfileCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;
  
  const roleDisplay = user.role === "admin" ? "Administrator" : "Customer";



  return (
    <div className="w-full max-w-md">

    <button
      onClick={() => navigate(-1)}
      className="
        mb-4
        flex
        items-center
        gap-2
        text-slate-400
        hover:text-cyan-400
        transition
      "
    >
      <ArrowLeft size={18} />
      Back
    </button>

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md">

      <div className="flex flex-col items-center">

        <ProfileAvatar
          name={user.name}
          size={90}
        />

        <h1 className="mt-5 text-2xl font-bold text-white">
          {user.name}
        </h1>

        <p className="text-slate-400">
          {user.email}
        </p>

      </div>

      <div className="border-t border-slate-800 my-6"></div>

      <div className="space-y-4">

        <div className="flex justify-between">

          <span className="text-slate-400">
            Role
          </span>

          <span className="text-white font-medium" >
            {roleDisplay}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-400">
            Company
          </span>

          <span className="text-white font-medium" >
            SupportAI
          </span>

        </div>

      </div>

    </div>

    </div>
  );
}

export default CustomerProfileCard;