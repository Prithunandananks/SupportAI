import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileMenu from "@/components/profile/ProfileMenu";

interface Props {
  title: string;
  onMenuClick: () => void;
}

function AdminHeader({ title, onMenuClick }: Props) {
  return (
    <header className="border-b border-slate-800 px-4 md:px-8 py-4 md:py-6">

      <div className="flex items-center justify-between">

        {/* Left Side */}
        <div className="flex items-center gap-4">

          {/* Mobile Menu */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-cyan-400"
          >
            <Menu size={26} />
          </button>

          <div>

            <Link
              to="/"
              className="
                inline-block
                text-xl
                md:text-3xl
                font-bold
                text-cyan-400
                hover:text-cyan-300
                transition-colors
              "
            >
              {title}
            </Link>

            <p className="text-slate-400 mt-1 text-xs md:text-base">
              Manage your SupportAI workspace.
            </p>

          </div>

        </div>

        {/* Right Side */}
        <ProfileMenu />

      </div>

    </header>
  );
}

export default AdminHeader;