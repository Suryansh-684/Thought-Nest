"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F1A] px-4">
      <AnimatedBackground />

      <div className="relative z-10 text-center">
        {/* Floating question mark */}
        <motion.div
          className="mb-6 text-8xl"
          animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          ❓
        </motion.div>

        {/* 404 number */}
        <motion.h1
          className="mb-2 bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text font-heading text-8xl font-bold text-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          404
        </motion.h1>

        <motion.p
          className="mb-2 font-heading text-2xl font-semibold text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          Lost in thought
        </motion.p>

        <motion.p
          className="mb-8 text-sm text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          This page wandered off and couldn&apos;t find its way back.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-colors hover:bg-violet-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ThoughtNest
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
