"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Orb 1 — violet, top-left, float up-down */}
      <motion.div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "#6C63FF", opacity: 0.2 }}
        animate={{ y: [0, -40, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 2 — rose, bottom-right, float right-left */}
      <motion.div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "#FF6584", opacity: 0.18 }}
        animate={{ x: [0, -40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 3 — indigo, center, pulse scale only */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "#4F46E5", opacity: 0.12 }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
