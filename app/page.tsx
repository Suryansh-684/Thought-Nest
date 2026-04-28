"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { ChevronDown, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard, { type Post } from "@/components/PostCard";
import SkeletonCard from "@/components/SkeletonCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 6;
const PHRASES = ["Stories worth reading.", "Ideas worth sharing.", "Voices worth hearing."];

/* ─────────────────────────────────────────────────────────────
   Orb
───────────────────────────────────────────────────────────── */
function Orb({
  color,
  size,
  style,
  animate,
  duration,
}: {
  color: string;
  size: number;
  style: React.CSSProperties;
  animate: TargetAndTransition;
  duration: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={{ width: size, height: size, background: color, opacity: 0.2, ...style }}
      animate={animate}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Typewriter
───────────────────────────────────────────────────────────── */
function Typewriter() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];

    if (typing) {
      if (displayed.length < phrase.length) {
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 40);
        return () => clearTimeout(t);
      } else {
        // Finished typing — pause then erase
        const t = setTimeout(() => setTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
        return () => clearTimeout(t);
      } else {
        // Finished erasing — move to next phrase
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, phraseIdx]);

  return (
    <span className="text-white/60">
      {displayed}
      <motion.span
        className="ml-0.5 inline-block h-5 w-0.5 bg-violet-400 align-middle"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero
───────────────────────────────────────────────────────────── */
function Hero({ onScrollDown }: { onScrollDown: () => void }) {
  const { role } = useAuth();
  const words = "Where Ideas Take Flight".split(" ");

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Orbs */}
      <Orb
        color="radial-gradient(circle, #6C63FF, transparent 70%)"
        size={700}
        style={{ top: "-180px", left: "-200px" }}
        animate={{ y: [0, -40, 0] }}
        duration={8}
      />
      <Orb
        color="radial-gradient(circle, #FF6584, transparent 70%)"
        size={600}
        style={{ bottom: "-160px", right: "-180px" }}
        animate={{ x: [0, 50, 0] }}
        duration={10}
      />
      <Orb
        color="radial-gradient(circle, #4F46E5, transparent 70%)"
        size={500}
        style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        animate={{ scale: [1, 1.18, 1] }}
        duration={6}
      />

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-4xl">
        {/* Eyebrow */}
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Premium Editorial Platform
        </motion.div>

        {/* Headline — word by word */}
        <h1 className="mb-6 font-heading text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block last:mr-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.1,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
            >
              {i === 3 ? (
                <span className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
                  {word}
                </span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h1>

        {/* Typewriter subheadline */}
        <motion.div
          className="mb-10 h-8 text-lg sm:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Typewriter />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <motion.button
            onClick={onScrollDown}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 transition-colors hover:bg-violet-500"
          >
            Start Reading
          </motion.button>

          {(role === "author" || role === "admin") && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/posts/create"
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <PenLine className="h-4 w-4" />
                Write a Story
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={onScrollDown}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/25 transition-colors hover:text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        aria-label="Scroll to posts"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-7 w-7" />
        </motion.div>
      </motion.button>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section title with animated underline
───────────────────────────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <motion.h2
        className="inline-block font-heading text-3xl font-bold text-white sm:text-4xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.h2>
      <motion.div
        className="mx-auto mt-3 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-rose-500"
        initial={{ width: 0 }}
        whileInView={{ width: "80px" }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Posts section
───────────────────────────────────────────────────────────── */
function PostsSection() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("posts")
      .select(
        "id, title, summary, body, image_url, created_at, author_id, users(name, avatar_url)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    const { data, count } = await query;
    setPosts((data as unknown as Post[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, page, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <SectionTitle>Latest Stories</SectionTitle>

      {/* Search */}
      <div className="mb-10 flex justify-center">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeletons"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div
            key="empty"
            className="py-28 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-4xl">🔍</p>
            <p className="mt-3 text-white/40">
              {search ? `No stories found for "${search}"` : "No stories yet. Be the first to write one!"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="posts"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          className="mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </motion.div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const postsRef = useRef<HTMLDivElement>(null);

  function scrollToPosts() {
    postsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative min-h-screen bg-[#0F0F1A]">
      <Hero onScrollDown={scrollToPosts} />

      {/* Divider fade */}
      <div className="h-24 bg-gradient-to-b from-transparent to-[#0F0F1A]" />

      <div ref={postsRef}>
        <PostsSection />
      </div>
    </div>
  );
}
