"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Pencil, ShieldCheck, Trash2, User, Users, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RoleGuard from "@/components/RoleGuard";
import AnimatedBackground from "@/components/AnimatedBackground";

/* ── Types ───────────────────────────────────────────────── */
interface UserRow  { id: string; name: string; email: string; role: string; created_at: string; }
interface PostRow  { id: string; title: string; created_at: string; users: { name: string } | null; }
interface CommentRow { id: string; comment_text: string; created_at: string; user_id: string;
  users: { name: string } | null; posts: { title: string } | null; }

type Tab = "posts" | "comments" | "users";

/* ── Animated counter ────────────────────────────────────── */
function AnimatedCount({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const duration = 1400;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      /* Ease-out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return <>{value.toLocaleString()}</>;
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, delay }: {
  label: string; value: number;
  icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="mb-3 flex items-center gap-2 text-white/35">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-4xl font-bold text-transparent">
        <AnimatedCount target={value} />
      </p>
    </motion.div>
  );
}

/* ── Role badge ──────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    viewer: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    author: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    admin:  "border-rose-500/40 bg-rose-500/10 text-rose-400",
  };
  const glow: Record<string, string> = {
    admin: "0 0 10px rgba(255,101,132,0.35)",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[role] ?? styles.viewer}`}
      style={{ boxShadow: glow[role] ?? "none" }}
    >
      {role}
    </span>
  );
}

/* ── Table shell ─────────────────────────────────────────── */
function TableShell({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/8 bg-white/4">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/35">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Table row wrapper with stagger ─────────────────────── */
function TR({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <motion.tr
      className={`border-b border-white/5 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {children}
    </motion.tr>
  );
}

const TD = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-5 py-3.5 text-white/60 ${className}`}>{children}</td>
);

/* ── Confirm-delete button ───────────────────────────────── */
function DeleteBtn({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={onConfirm}
          className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/8 px-2.5 py-1.5 text-xs text-rose-400/70 transition-all hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}

/* ── Dashboard inner ─────────────────────────────────────── */
function AdminDashboard() {
  const supabase = createClient();

  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [posts,    setPosts]    = useState<PostRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("posts");

  useEffect(() => {
    async function load() {
      const [{ data: u }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("posts").select("id, title, created_at, users(name)").order("created_at", { ascending: false }),
        supabase.from("comments").select("id, comment_text, created_at, user_id, users(name), posts(title)").order("created_at", { ascending: false }),
      ]);
      setUsers((u as unknown as UserRow[]) ?? []);
      setPosts((p as unknown as PostRow[]) ?? []);
      setComments((c as unknown as CommentRow[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function deleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function updateRole(userId: string, newRole: string) {
    await supabase.from("users").update({ role: newRole }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "posts",    label: "Posts",    icon: FileText,      count: posts.length },
    { key: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
    { key: "users",    label: "Users",    icon: Users,         count: users.length },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0F1A]">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">

        {/* ── Header ── */}
        <motion.div
          className="mb-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/30">
              <ShieldCheck className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-white">Admin Dashboard</h1>
            </div>
          </div>
          <span className="ml-auto rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400"
            style={{ boxShadow: "0 0 10px rgba(255,101,132,0.2)" }}>
            Administrator
          </span>
        </motion.div>

        {/* ── Stats ── */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Posts"    value={posts.length}    icon={FileText}      delay={0.05} />
          <StatCard label="Total Users"    value={users.length}    icon={User}          delay={0.12} />
          <StatCard label="Total Comments" value={comments.length} icon={MessageSquare} delay={0.19} />
        </div>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-2">
          {TABS.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                tab === key
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "border border-white/10 bg-white/5 text-white/50 hover:border-violet-500/30 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === key ? "bg-white/20" : "bg-white/8"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tables ── */}
        <AnimatePresence mode="wait">

          {/* Posts */}
          {tab === "posts" && (
            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableShell headers={["Title", "Author", "Date", "Actions"]}>
                <AnimatePresence>
                  {posts.map((p, i) => (
                    <TR key={p.id} i={i}>
                      <TD>
                        <span className="line-clamp-1 max-w-xs font-medium text-white/80">{p.title}</span>
                      </TD>
                      <TD>{p.users?.name ?? "—"}</TD>
                      <TD>{fmt(p.created_at)}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/posts/${p.id}/edit`}
                            className="flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/8 px-2.5 py-1.5 text-xs text-violet-400/70 transition-all hover:border-violet-500/40 hover:bg-violet-500/15 hover:text-violet-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <DeleteBtn onConfirm={() => deletePost(p.id)} />
                        </div>
                      </TD>
                    </TR>
                  ))}
                </AnimatePresence>
              </TableShell>
            </motion.div>
          )}

          {/* Comments */}
          {tab === "comments" && (
            <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableShell headers={["Comment", "Author", "Post", "Actions"]}>
                <AnimatePresence>
                  {comments.map((c, i) => (
                    <TR key={c.id} i={i}>
                      <TD>
                        <span className="line-clamp-1 max-w-xs text-white/70">{c.comment_text}</span>
                      </TD>
                      <TD>{c.users?.name ?? "—"}</TD>
                      <TD>
                        <span className="line-clamp-1 max-w-[160px] text-white/40">{c.posts?.title ?? "—"}</span>
                      </TD>
                      <TD>
                        <DeleteBtn onConfirm={() => deleteComment(c.id)} />
                      </TD>
                    </TR>
                  ))}
                </AnimatePresence>
              </TableShell>
            </motion.div>
          )}

          {/* Users */}
          {tab === "users" && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableShell headers={["User", "Email", "Role", "Joined", "Change Role"]}>
                <AnimatePresence>
                  {users.map((u, i) => (
                    <TR key={u.id} i={i}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600/25 ring-1 ring-violet-500/20">
                            <User className="h-3.5 w-3.5 text-violet-400" />
                          </div>
                          <span className="font-medium text-white/80">{u.name}</span>
                        </div>
                      </TD>
                      <TD>{u.email}</TD>
                      <TD><RoleBadge role={u.role} /></TD>
                      <TD>{fmt(u.created_at)}</TD>
                      <TD>
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 focus:border-violet-500/50 focus:outline-none transition-colors"
                        >
                          <option value="viewer">viewer</option>
                          <option value="author">author</option>
                          <option value="admin">admin</option>
                        </select>
                      </TD>
                    </TR>
                  ))}
                </AnimatePresence>
              </TableShell>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Export wrapped in RoleGuard ─────────────────────────── */
export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminDashboard />
    </RoleGuard>
  );
}
