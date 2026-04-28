"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Pencil, Sparkles, User } from "lucide-react";
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
      {/* Image moves at 0.3x scroll speed */}
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${offsetY * 0.3}px) scale(1.1)` }}
      >
        <Image src={src} alt={alt} fill className="object-cover" priority />
      </div>
      {/* Bottom gradient fade to page bg */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/30 to-transparent" />
    </div>
  );
}

/* ── AI Summary box ─────────────────────────────────────────── */
function AISummaryBox({ summary }: { summary: string }) {
  return (
    <motion.div
      className="relative mb-10 overflow-hidden rounded-2xl border border-violet-500/20 bg-white/4 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Violet left accent bar */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-violet-500 to-rose-500" />

      <div className="px-6 py-5 pl-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            AI Summary
          </span>
        </div>
        <p className="text-sm italic leading-relaxed text-white/60">{summary}</p>
      </div>
    </motion.div>
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

      {/* ── Hero image ── */}
      {post.image_url ? (
        <ParallaxHero src={post.image_url} alt={post.title} />
      ) : (
        /* Spacer so content doesn't sit flush under navbar */
        <div className="h-16" />
      )}

      {/* ── Content ── */}
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

        {/* ── Post header ── */}
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

        {/* ── AI Summary ── */}
        {post.summary && <AISummaryBox summary={post.summary} />}

        {/* ── Body ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <BookFlipReader body={post.body} />
        </motion.div>

        {/* ── Comments ── */}
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
