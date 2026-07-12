import { Menu, House } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProfileMenu from "@/components/profile/ProfileMenu";

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ChatHeader({ setSidebarOpen }: Props) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-800 px-5 md:px-8 py-3 md:py-6 flex items-center justify-between">
      
      {/* Left */}
      <div className="flex items-center gap-5">

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-cyan-400 hover:text-cyan-300 transition"
        >
          <Menu size={24} />
        </button>

        {/* Logo & Subtitle */}
        <div>
          <Link
            to="/"
            className=" text-base md:text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            SupportAI
          </Link>

          <p className="hidden md:block text-slate-400 mt-1">
            AI Customer Support Assistant
          </p>
        </div>

      </div>

      {/* Desktop Home Button */}
      <div className="flex items-center gap-3">

        <button
  onClick={() => navigate("/dashboard")}
  className="
    flex
    items-center
    gap-1.5
    h-11
    px-3
    rounded-xl
    border
    border-slate-700
    bg-slate-900
    hover:border-cyan-500
    hover:bg-slate-800
    transition-all
    duration-300
  "
>
  <House size={18} />

  <span className="hidden sm:inline font-medium">
    Home
  </span>
</button>

        <ProfileMenu />

      </div>

    </header>
  );
}

export default ChatHeader;