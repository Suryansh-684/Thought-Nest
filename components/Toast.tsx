"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Info, XCircle, X } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ── Context ────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/* ── Hook ───────────────────────────────────────────────────── */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ── Single toast card ──────────────────────────────────────── */
const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const COLORS: Record<ToastType, string> = {
  success: "border-green-500/25 bg-green-500/10 text-green-400",
  error:   "border-rose-500/25  bg-rose-500/10  text-rose-400",
  info:    "border-violet-500/25 bg-violet-500/10 text-violet-400",
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = ICONS[item.type];

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl shadow-black/50 backdrop-blur-md ${COLORS[item.type]}`}
      style={{ minWidth: "260px", maxWidth: "360px" }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm font-medium text-white/90">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-white/30 transition-colors hover:text-white/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

/* ── Provider ───────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal-like fixed container */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2.5">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
