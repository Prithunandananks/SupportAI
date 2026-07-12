import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuthCore";
import ProfileMenu from "@/components/profile/ProfileMenu";

interface Props {
  forcePublic?: boolean;
}

function Navbar({ forcePublic = false }: Props = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  const showAuthenticatedMenu = isAuthenticated && !forcePublic && !isPublicRoute;

  return (
    <nav className="bg-slate-950 border-b border-slate-800">
      <div className="w-full px-5 md:px-8 py-4 md:py-5 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="
            text-xl
            md:text-2xl
            font-bold
            text-cyan-400
            hover:text-cyan-300
            transition-colors
            duration-200
          "
        >
          SupportAI
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {showAuthenticatedMenu ? (
            <ProfileMenu />
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-5 py-2 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-cyan-400"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-5 flex flex-col gap-3 bg-slate-950 border-t border-slate-800 animate-in fade-in duration-200 pt-4">
          {showAuthenticatedMenu ? (
            <div className="flex justify-end">
              <ProfileMenu />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center px-5 py-3 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center px-5 py-3 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
