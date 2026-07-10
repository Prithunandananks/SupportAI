import { X, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [localQuery, onChange]);

  return (
    <div className="sticky top-0 z-10 bg-slate-900 px-4 py-3 border-b border-slate-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-slate-800 text-sm text-slate-200 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          aria-label="Search conversations"
        />
        {localQuery && (
          <button
            onClick={() => setLocalQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition rounded-md"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
