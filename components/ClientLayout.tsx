"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthProvider>
      <ToastProvider>
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 pt-16"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </ToastProvider>
    </AuthProvider>
  );
}
