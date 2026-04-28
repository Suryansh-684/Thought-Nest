"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Feather } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function Orb({ color, size, style, duration }: {
  color: string; size: number; style: React.CSSProperties; duration: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={{ width: size, height: size, background: color, opacity: 0.18, ...style }}
      animate={{ y: [0, -28, 0], x: [0, 14, 0], scale: [1, 1.08, 1] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.25 + i * 0.1, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 backdrop-blur-sm focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If there's an explicit redirectTo param, honour it
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    // Otherwise redirect by role
    if (data.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = userData?.role ?? "viewer";
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "author") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F1A] px-4">
      <Orb color="radial-gradient(circle, #6C63FF, transparent 70%)" size={520} style={{ top: "-120px", left: "-140px" }} duration={14} />
      <Orb color="radial-gradient(circle, #FF6584, transparent 70%)" size={420} style={{ bottom: "-100px", right: "-120px" }} duration={18} />
      <Orb color="radial-gradient(circle, #8B83FF, transparent 70%)" size={300} style={{ top: "40%", right: "10%" }} duration={22} />

      <div className="relative z-10 w-full max-w-md">
        <motion.div className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="mb-3 flex items-center justify-center gap-2">
            <Feather className="h-7 w-7 text-violet-400" />
            <span className="font-heading text-2xl font-bold text-white">
              Thought<span className="text-violet-400">Nest</span>
            </span>
            <span className="text-xl">🪺</span>
          </div>
          <p className="text-sm text-white/40">Your dark luxury editorial space</p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-white/10 bg-[#1A1A2E] p-8 shadow-2xl shadow-black/60 backdrop-blur-md"
          style={{ background: "rgba(26,26,46,0.85)" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}>

          <motion.h1 className="mb-6 text-xl font-semibold text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}>
            Welcome back
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" className={inputCls} />
            </motion.div>

            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••" className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.p>
            )}

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button type="submit" disabled={loading}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : "Login"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p className="mt-5 text-center text-sm text-white/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-violet-400 transition-colors hover:text-violet-300 hover:underline">
            Register
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
