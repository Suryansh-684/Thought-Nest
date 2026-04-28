"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Feather, Info } from "lucide-react";
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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"viewer" | "author" | "admin">("viewer");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Sign up with Supabase Auth
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      // Translate Supabase rate-limit / email errors into plain English
      const msg = authError.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("email rate") || msg.includes("too many")) {
        setError(
          "Too many sign-up attempts. Go to Supabase Dashboard → Authentication → Providers → Email and turn off \"Confirm email\", then try again."
        );
      } else if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Upsert role into users table (trigger creates the row with 'viewer',
    //    we update it to the selected role immediately after)
    if (signUpData.user) {
      await supabase
        .from("users")
        .upsert({ id: signUpData.user.id, email, name, role })
        .eq("id", signUpData.user.id);
    }

    // 3. Redirect based on role
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "author") {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F1A] px-4">
      <Orb color="radial-gradient(circle, #6C63FF, transparent 70%)" size={500} style={{ top: "-100px", right: "-120px" }} duration={16} />
      <Orb color="radial-gradient(circle, #FF6584, transparent 70%)" size={400} style={{ bottom: "-80px", left: "-100px" }} duration={20} />
      <Orb color="radial-gradient(circle, #8B83FF, transparent 70%)" size={280} style={{ top: "35%", left: "8%" }} duration={24} />

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
          <p className="text-sm text-white/40">Create your account</p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/60"
          style={{ background: "rgba(26,26,46,0.85)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}>

          <motion.h1 className="mb-6 text-xl font-semibold text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}>
            Create your account
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="Your name" className={inputCls} />
            </motion.div>

            {/* Email */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" className={inputCls} />
            </motion.div>

            {/* Password */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} placeholder="Min. 6 characters"
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {/* Role selector */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "author" | "admin")}
                className="w-full rounded-xl border border-white/10 bg-[#1A1A2E] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors"
              >
                <option value="viewer">Viewer — read posts &amp; comment</option>
                <option value="author">Author — create &amp; manage posts</option>
                <option value="admin">Admin — full access</option>
              </select>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                <p className="text-xs text-white/45">
                  Role selector is available for testing. In production, an admin assigns roles.
                </p>
              </div>
            </motion.div>

            {error && (
              <motion.p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.p>
            )}

            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button type="submit" disabled={loading}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account…
                  </span>
                ) : "Create Account"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p className="mt-5 text-center text-sm text-white/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-violet-400 transition-colors hover:text-violet-300 hover:underline">
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
