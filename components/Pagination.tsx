"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  /* Build a smart window: always show first, last, current ±1, with ellipsis */
  function getPages(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* Prev */}
      <PagBtn
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PagBtn>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-white/25">
            …
          </span>
        ) : (
          <PagBtn
            key={p}
            onClick={() => onPageChange(p as number)}
            active={p === page}
          >
            {p}
          </PagBtn>
        )
      )}

      {/* Next */}
      <PagBtn
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PagBtn>
    </div>
  );
}

function PagBtn({
  children,
  onClick,
  disabled,
  active,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={disabled ? {} : { scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors
        ${active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
          : disabled
          ? "cursor-not-allowed text-white/20"
          : "border border-white/10 bg-white/5 text-white/50 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
        }`}
    >
      {children}
    </motion.button>
  );
}
