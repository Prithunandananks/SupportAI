import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

function ChatHeader() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const initials = user?.first_name 
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ""}`.toUpperCase()
    : user?.email.substring(0, 2).toUpperCase() || "U";

  const displayName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ""}`.trim() 
    : user?.email || "User";

  return (
    <header className="border-b border-slate-800 p-6 flex items-center justify-between bg-slate-950">
      <div>
        <h1 className="text-2xl font-bold text-cyan-400">
          🤖 SupportAI
        </h1>
        <p className="text-slate-400 mt-1">
          AI Customer Support Assistant
        </p>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
          aria-label="User menu"
          className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-slate-200">
              {displayName}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              {user?.role || "Customer"}
            </div>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div 
            role="menu"
            className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="px-4 py-3 border-b border-slate-700 sm:hidden">
              <div className="text-sm font-medium text-slate-200 truncate">{displayName}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
            <div className="p-1">
              <button 
                role="menuitem"
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors outline-none focus-visible:bg-red-500/10"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default ChatHeader;