"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, ChevronDown, Pencil, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BookFlipReader from "@/components/BookFlipReader";
import CommentSection from "@/components/CommentSection";

/* ── Types ─────────────────────────────────────────────────── */
interface PostData {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
  author_id: string;
  users: { id: string; name: string; avatar_url: string | null } | null;
}

/* ── Reading progress bar ───────────────────────────────────── */
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    }
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[3px] w-full bg-white/5">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-violet-500 to-rose-500"
        style={{ scaleX: progress / 100 }}
        transition={{ duration: 0 }}
      />
    </div>
  );
}

/* ── Parallax hero image ────────────────────────────────────── */
function ParallaxHero({ src, alt }: { src: string; alt: string }) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    function onScroll() { setOffsetY(window.scrollY); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative h-[420px] w-full overflow-hidden sm:h-[500px]">
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${offsetY * 0.3}px) scale(1.1)` }}
      >
        <Image src={src} alt={alt} fill className="object-cover" priority />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/30 to-transparent" />
    </div>
  );
}

/* ── AI Summary Panel ───────────────────────────────────────── */
/*
 * Visible to ALL readers (not just author/admin).
 * - If summary already exists in DB: show it immediately when expanded.
 * - If summary is null: generate it on first expand, save to DB, then show.
 * The blog body is chunked into 200-word parts server-side; each part is
 * summarised and then consolidated into one final 200-word summary.
 */
function AISummaryPanel({
  postId,
  postBody,
  initialSummary,
}: {
  postId: string;
  postBody: string;
  initialSummary: string | null;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");

  async function handleOpen() {
    const next = !open;
    setOpen(next);

    // Already have a summary — nothing to do
    if (!next || summary) return;

    // Generate on first open
    setGenerating(true);
    setError("");

    // Show chunking progress hint
    const wordCount = postBody.trim().split(/\s+/).length;
    const chunkCount = Math.ceil(wordCount / 200);
    setStatusText(
      chunkCount > 1
        ? `Processing ${chunkCount} sections of ~200 words each…`
        : "Generating summary…"
    );

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: postBody }),
      });

      const data = await res.json();

      if (!res.ok || !data.summary) {
        setError(data.error ?? "Failed to generate summary. Please try again.");
        setGenerating(false);
        setStatusText("");
        return;
      }

      // Save to DB so future opens are instant
      await supabase
        .from("posts")
        .update({ summary: data.summary })
        .eq("id", postId);

      setSummary(data.summary);
    } catch (err) {
      setError("Network error — " + String(err));
    }

    setGenerating(false);
    setStatusText("");
  }

  return (
    <div className="mb-10">
      {/* Toggle button — always visible */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/8 px-5 py-4 text-left transition-all hover:border-violet-400/50 hover:bg-violet-500/12"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-300">✨ AI Summary</p>
            <p className="text-xs text-white/35">
              {summary
                ? "Tap to read the AI-generated summary"
                : "Tap to generate a summary of this post"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-violet-400" />
        </motion.div>
      </motion.button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative rounded-b-2xl border border-t-0 border-violet-500/20 bg-[#1A1A2E]/80 px-5 py-5 backdrop-blur-sm">
              {/* Violet left accent */}
              <div className="absolute left-0 top-0 h-full w-1 rounded-bl-2xl bg-gradient-to-b from-violet-500 to-rose-500" />

              <div className="pl-3">
                {generating ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    {/* Animated processing indicator */}
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
                      <span className="text-sm font-medium text-violet-300">
                        Generating AI summary…
                      </span>
                    </div>
                    {statusText && (
                      <p className="text-xs text-white/35">{statusText}</p>
                    )}
                    {/* Chunk progress dots */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-violet-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <div className="py-2">
                    <p className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                      {error}
                    </p>
                    <button
                      onClick={() => { setSummary(null); setError(""); setOpen(false); setTimeout(() => handleOpen(), 50); }}
                      className="text-xs text-violet-400 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : summary ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400/70">
                      Summary · ~200 words
                    </p>
                    <p className="text-sm italic leading-relaxed text-white/65">
                      {summary}
                    </p>
                  </motion.div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const supabase = createClient();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from("posts")
        .select("*, users(id, name, avatar_url)")
        .eq("id", id)
        .single();

      if (error || !data) { router.push("/"); return; }
      setPost(data as unknown as PostData);
      setLoading(false);
    }
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F1A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!post) return null;

  const canEdit = user?.id === post.author_id || role === "admin";
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      <ReadingProgressBar />

      {/* Hero image */}
      {post.image_url ? (
        <ParallaxHero src={post.image_url} alt={post.title} />
      ) : (
        <div className="h-16" />
      )}

      {/* Content */}
      <div ref={contentRef} className="relative z-10 mx-auto max-w-3xl px-4 pb-24 sm:px-6">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={post.image_url ? "-mt-16 mb-8" : "mb-8 pt-8"}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white/50 backdrop-blur-sm transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>
        </motion.div>

        {/* Post header */}
        <motion.header
          className="mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="mb-6 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Author + date */}
            <div className="flex items-center gap-4 text-sm text-white/40">
              <div className="flex items-center gap-2">
                {post.users?.avatar_url ? (
                  <Image
                    src={post.users.avatar_url}
                    alt={post.users.name}
                    width={28}
                    height={28}
                    className="rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/30 ring-1 ring-violet-500/20">
                    <User className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                )}
                <span className="font-medium text-white/60">
                  {post.users?.name ?? "Anonymous"}
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
            </div>

            {/* Edit button */}
            {canEdit && (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 transition-all hover:border-violet-400 hover:bg-violet-500/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Post
                </Link>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* ── AI Summary Panel — visible to everyone ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <AISummaryPanel
            postId={post.id}
            postBody={post.body}
            initialSummary={post.summary}
          />
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <BookFlipReader body={post.body} />
        </motion.div>

        {/* Comments */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CommentSection postId={post.id} />
        </motion.div>
      </div>
    </div>
  );
}
