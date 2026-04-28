"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Sparkles, User } from "lucide-react";

export interface Post {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  users: { name: string; avatar_url: string | null } | null;
}

export default function PostCard({ post }: { post: Post }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientY - top - height / 2) / (height / 2);   // rotateX
    const y = -(e.clientX - left - width / 2) / (width / 2);   // rotateY (inverted)
    setTilt({ x: x * 6, y: y * 6 });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  const excerpt = post.summary ?? post.body.slice(0, 130) + "…";
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Link href={`/posts/${post.id}`} className="block focus:outline-none">
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: hovered ? "transform 0.08s linear" : "transform 0.5s ease",
          willChange: "transform",
        }}
        className="group h-full overflow-hidden rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm transition-shadow duration-300 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10"
      >
        {/* Cover image */}
        <div className="relative h-48 w-full overflow-hidden bg-white/5">
          {post.image_url ? (
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl opacity-10">🪺</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A]/60 to-transparent" />
        </div>

        <div className="p-5">
          {/* Badges + date */}
          <div className="mb-3 flex items-center gap-2">
            {post.summary && (
              <span className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                <Sparkles className="h-2.5 w-2.5" />
                AI Summary
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-white/30">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
          </div>

          {/* Title */}
          <h2 className="mb-2 font-heading text-base font-semibold leading-snug text-white transition-colors group-hover:text-violet-300 line-clamp-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="mb-4 text-sm leading-relaxed text-white/40 line-clamp-2">
            {excerpt}
          </p>

          {/* Author + Read button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.users?.avatar_url ? (
                <Image
                  src={post.users.avatar_url}
                  alt={post.users.name}
                  width={26}
                  height={26}
                  className="rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/30 ring-1 ring-violet-500/20">
                  <User className="h-3 w-3 text-violet-400" />
                </div>
              )}
              <span className="text-xs text-white/40">
                {post.users?.name ?? "Anonymous"}
              </span>
            </div>

            <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-all group-hover:border-violet-500/40 group-hover:bg-violet-500/10 group-hover:text-violet-300">
              Read
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
