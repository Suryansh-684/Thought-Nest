"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search stories…",
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Keep local in sync when parent resets */
  useEffect(() => { setLocal(value); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), 300);
  }

  function clear() {
    setLocal("");
    onChange("");
  }

  return (
    <div className="relative w-full max-w-lg">
      {/* Glass container */}
      <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors focus-within:border-violet-500/50 focus-within:bg-white/8">
        <Search className="ml-4 h-4 w-4 shrink-0 text-white/30" />

        <input
          type="text"
          value={local}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none"
        />

        <AnimatePresence>
          {local && (
            <motion.button
              type="button"
              onClick={clear}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/50 transition-colors hover:bg-white/25 hover:text-white"
            >
              <X className="h-3 w-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
