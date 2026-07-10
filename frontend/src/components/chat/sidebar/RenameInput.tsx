import { useEffect, useRef, useState } from "react";

interface RenameInputProps {
  initialTitle: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export function RenameInput({ initialTitle, onSave, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      save();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialTitle) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={save}
      className="w-full bg-slate-800 text-sm text-slate-100 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
      onClick={(e) => e.stopPropagation()}
    />
  );
}
