"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Spinner";

type UserRole = "viewer" | "author" | "admin";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useAuth();
  const router = useRouter();

  const denied = !loading && (!role || !allowedRoles.includes(role));

  /* Auto-redirect after 2 s if denied and no custom fallback provided */
  useEffect(() => {
    if (!denied || fallback) return;
    const t = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(t);
  }, [denied, fallback, router]);

  /* Loading spinner */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  /* Denied — custom fallback or built-in screen */
  if (denied) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="h-9 w-9 text-rose-400" />
          </motion.div>

          <h2 className="mb-2 font-heading text-2xl font-bold text-white">Access Denied</h2>
          <p className="mb-1 text-sm text-white/40">
            You don&apos;t have permission to view this page.
          </p>
          <p className="text-xs text-white/25">Redirecting you home…</p>

          {/* Progress bar */}
          <div className="mx-auto mt-6 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-rose-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
