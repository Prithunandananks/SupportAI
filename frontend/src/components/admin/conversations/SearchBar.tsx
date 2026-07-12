import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: Props) {
  return (
      <div className="relative mb-4 md:mb-6">

        <Search
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-500
          "
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search conversations..."
          className="
            w-full
            bg-slate-900
            border
            border-slate-800
            rounded-xl
            pl-11
            pr-4
            py-2.5
            md:py-3
            text-sm
            md:text-base
            outline-none
            transition-all
            focus:border-cyan-500
          "
        />

      </div>
    );
}

export default SearchBar;