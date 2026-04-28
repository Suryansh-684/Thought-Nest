"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Trash2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";

/* ── Types ─────────────────────────────────────────────────── */
interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  users: { name: string; avatar_url: string | null } | null;
}

/* ── Relative time helper ───────────────────────────────────── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Single comment card ────────────────────────────────────── */
function CommentCard({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    onDelete(comment.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="group rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        {/* Avatar + meta */}
        <div className="flex items-center gap-3">
          {comment.users?.avatar_url ? (
            <Image
              src={comment.users.avatar_url}
              alt={comment.users.name}
              width={32}
              height={32}
              className="rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/30 ring-1 ring-violet-500/20">
              <User className="h-3.5 w-3.5 text-violet-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white/80">
              {comment.users?.name ?? "Anonymous"}
            </p>
            <p className="text-xs text-white/30">{relativeTime(comment.created_at)}</p>
          </div>
        </div>

        {/* Delete */}
        {canDelete && (
          <motion.button
            onClick={handleDelete}
            disabled={deleting}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 rounded-lg p-1.5 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>

      <p className="text-sm leading-relaxed text-white/55">{comment.comment_text}</p>
    </motion.div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function CommentSection({ postId }: { postId: string }) {
  const { user, role } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Fetch ── */
  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("comments")
        .select("*, users(name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setComments((data as unknown as Comment[]) ?? []);
      setLoading(false);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  /* ── Submit with optimistic update ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);

    /* Optimistic comment */
    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      comment_text: text.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      users: {
        name: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "You",
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      },
    };
    setComments((prev) => [...prev, optimistic]);
    setText("");
    textareaRef.current?.focus();

    /* Real insert */
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, comment_text: optimistic.comment_text })
      .select("*, users(name, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? (data as unknown as Comment) : c))
      );
      toast("Comment posted!", "success");
    } else {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      toast("Failed to post comment.", "error");
    }

    setSubmitting(false);
  }

  /* ── Delete ── */
  function handleDelete(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    supabase.from("comments").delete().eq("id", id);
  }

  /* ── Auto-resize textarea ── */
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <section className="mt-16 border-t border-white/8 pt-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-violet-400" />
        <h3 className="font-heading text-xl font-semibold text-white">
          Comments
          {!loading && (
            <span className="ml-2 text-base font-normal text-white/30">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {/* ── Comment form ── */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm transition-colors focus-within:border-violet-500/40">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Share your thoughts…"
              rows={2}
              style={{ resize: "none", minHeight: "72px" }}
              className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
              <span className="text-xs text-white/20">
                {text.length > 0 ? `${text.length} chars` : "Be kind and constructive"}
              </span>
              <motion.button
                type="submit"
                disabled={submitting || !text.trim()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Post Comment
              </motion.button>
            </div>
          </div>
        </form>
      ) : (
        <motion.div
          className="mb-10 rounded-2xl border border-white/8 bg-white/4 px-6 py-5 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-white/40">
            <Link href="/auth/login" className="font-semibold text-violet-400 hover:underline">
              Sign in
            </Link>{" "}
            to join the conversation.
          </p>
        </motion.div>
      )}

      {/* ── Comments list ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/8 bg-white/4 p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/8" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-white/8" />
                  <div className="h-2.5 w-14 rounded bg-white/5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/6" />
                <div className="h-3 w-4/5 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <motion.div
          className="py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-3xl">💬</p>
          <p className="mt-2 text-sm text-white/30">
            No comments yet. Start the conversation!
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                canDelete={user?.id === c.user_id || role === "admin"}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
