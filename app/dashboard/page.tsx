"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, PenLine, Pencil, Plus, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AnimatedBackground from "@/components/AnimatedBackground";
import Spinner from "@/components/Spinner";

interface MyPost {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";

  useEffect(() => {
    if (!user || (role !== "author" && role !== "admin")) return;
    setLoadingPosts(true);
    supabase
      .from("posts")
      .select("id, title, summary, image_url, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as MyPost[]) ?? []);
        setLoadingPosts(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F1A]">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F1A]">
        <div className="text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 text-white/50">Please sign in to view your dashboard.</p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0F1A]">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-14 sm:px-6">

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/40">Welcome back, {displayName}</p>
        </motion.div>

        {/* Profile card */}
        <motion.div
          custom={0}
          variants={rise}
          initial="hidden"
          animate="visible"
          className="mb-8 flex flex-wrap items-center gap-5 rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/30 ring-2 ring-violet-500/30">
            <User className="h-7 w-7 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">{displayName}</p>
            <p className="text-sm text-white/40">{user.email}</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
              role === "admin"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : role === "author"
                ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
            }`}
          >
            {role ?? "viewer"}
          </span>
        </motion.div>

        {/* Viewer message */}
        {role === "viewer" && (
          <motion.div
            custom={1}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/8 p-6"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
              <div>
                <p className="font-semibold text-white">You&apos;re a Viewer</p>
                <p className="mt-1 text-sm text-white/50">
                  You can read all posts and leave comments. Ask an admin to upgrade your role to Author if you&apos;d like to write.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Browse stories
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Author / Admin section */}
        {(role === "author" || role === "admin") && (
          <>
            {/* Create CTA */}
            <motion.div custom={1} variants={rise} initial="hidden" animate="visible" className="mb-8">
              <Link
                href="/posts/create"
                className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
              >
                <Plus className="h-5 w-5" />
                Create New Blog Post
              </Link>
            </motion.div>

            {/* My posts */}
            <motion.div custom={2} variants={rise} initial="hidden" animate="visible">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-white">
                  My Posts
                  {!loadingPosts && (
                    <span className="ml-2 text-base font-normal text-white/30">
                      ({posts.length})
                    </span>
                  )}
                </h2>
                <Link
                  href="/posts/create"
                  className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20"
                >
                  <PenLine className="h-3.5 w-3.5" /> New Post
                </Link>
              </div>

              {loadingPosts ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/4 py-16 text-center">
                  <p className="text-3xl">✍️</p>
                  <p className="mt-3 text-white/40">No posts yet. Write your first story!</p>
                  <Link
                    href="/posts/create"
                    className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                  >
                    Write Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      custom={i}
                      variants={rise}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 transition-colors hover:border-violet-500/30"
                    >
                      {/* Thumbnail */}
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                        {post.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl opacity-20">
                            🪺
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white/85">{post.title}</p>
                        {post.summary && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-white/35">
                            {post.summary}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1 text-xs text-white/25">
                          <Calendar className="h-3 w-3" /> {fmt(post.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/posts/${post.id}`}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white"
                        >
                          View
                        </Link>
                        <Link
                          href={`/posts/${post.id}/edit`}
                          className="flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/8 px-3 py-1.5 text-xs text-violet-400 transition-colors hover:bg-violet-500/15"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
