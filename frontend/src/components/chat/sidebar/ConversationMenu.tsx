import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ConversationMenuProps {
  onRename: () => void;
  onDelete: () => void;
}

export function ConversationMenu({ onRename, onDelete }: ConversationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
        aria-label="Conversation options"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-[60]">
          <button
            onClick={(e) => handleAction(e, onRename)}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition flex items-center space-x-2"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Rename</span>
          </button>
          <button
            onClick={(e) => handleAction(e, onDelete)}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition flex items-center space-x-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
