"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ImagePlus, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import RoleGuard from "@/components/RoleGuard";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useToast } from "@/components/Toast";

/* ─── Types ──────────────────────────────────────────────── */
type PublishStep =
  | "idle"
  | "uploading"
  | "summarising"
  | "inserting"
  | "success";

const STEP_LABELS: Record<PublishStep, string> = {
  idle: "Publish Post",
  uploading: "Uploading image…",
  summarising: "✨ Generating AI summary…",
  inserting: "Publishing…",
  success: "Published!",
};

/* ─── Stagger variant ────────────────────────────────────── */
const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

/* ─── Word / char counter ────────────────────────────────── */
function BodyCounter({ text }: { text: string }) {
  const chars = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  return (
    <span className="text-xs text-white/30">
      {words.toLocaleString()} words · {chars.toLocaleString()} chars
    </span>
  );
}

/* ─── Drag-drop image zone ───────────────────────────────── */
function ImageDropZone({
  preview,
  onFile,
  onRemove,
}: {
  preview: string | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(file: File) {
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) accept(file);
  }

  if (preview) {
    return (
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Cover preview"
          className="h-56 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="absolute bottom-3 left-4 text-xs text-white/60">
          Cover image selected
        </p>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex h-44 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
        dragging
          ? "border-violet-400 bg-violet-500/10"
          : "border-white/15 bg-white/3 hover:border-violet-500/50 hover:bg-violet-500/5"
      }`}
    >
      {/* Animated dash offset */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ borderRadius: "1rem" }}>
        <rect
          x="1" y="1"
          width="calc(100% - 2px)" height="calc(100% - 2px)"
          rx="15" ry="15"
          fill="none"
          stroke={dragging ? "#7c6fff" : "#ffffff22"}
          strokeWidth="2"
          strokeDasharray="8 6"
          style={{
            animation: dragging ? "dash 1s linear infinite" : "none",
          }}
        />
      </svg>

      <motion.div
        animate={dragging ? { scale: 1.15 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <ImagePlus className={`h-8 w-8 transition-colors ${dragging ? "text-violet-400" : "text-white/25"}`} />
      </motion.div>

      <div className="text-center">
        <p className={`text-sm font-medium transition-colors ${dragging ? "text-violet-300" : "text-white/40"}`}>
          {dragging ? "Drop to set cover" : "Drag & drop or click to upload"}
        </p>
        <p className="mt-0.5 text-xs text-white/20">PNG, JPG, WEBP up to 10 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }}
      />

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -28; } }
      `}</style>
    </div>
  );
}

/* ─── Magnetic submit button ─────────────────────────────── */
function MagneticSubmit({
  step,
  disabled,
}: {
  step: PublishStep;
  disabled: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function onMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: (e.clientX - rect.left - rect.width / 2) * 0.25,
      y: (e.clientY - rect.top - rect.height / 2) * 0.25,
    });
  }

  return (
    <motion.button
      ref={ref}
      type="submit"
      disabled={disabled}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* Shimmer sweep while busy */}
      {step !== "idle" && step !== "success" && (
        <motion.span
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
          animate={{ translateX: ["−100%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {step === "success" ? (
        <motion.span
          className="flex items-center gap-2"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <CheckCircle className="h-4 w-4 text-green-300" />
          Published!
        </motion.span>
      ) : step !== "idle" ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {STEP_LABELS[step]}
        </span>
      ) : (
        STEP_LABELS.idle
      )}
    </motion.button>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
function CreatePostForm() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<PublishStep>("idle");

  /* Auto-resize textarea */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 400)}px`;
  }, [body]);

  const handleFile = useCallback((file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    /* ── Step 1: upload image ── */
    let image_url: string | null = null;
    if (imageFile) {
      setStep("uploading");
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, { upsert: true });
      if (uploadErr) {
        setError("Image upload failed: " + uploadErr.message);
        setStep("idle");
        return;
      }
      image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }

    /* ── Step 2: generate summary ── */
    setStep("summarising");
    let summary: string | null = null;
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (data.summary) summary = data.summary;
    } catch {
      /* non-fatal — publish without summary */
    }

    /* ── Step 3: insert post ── */
    setStep("inserting");
    const { data: post, error: insertErr } = await supabase
      .from("posts")
      .insert({ title, body, image_url, author_id: user.id, summary })
      .select("id")
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setStep("idle");
      return;
    }

    /* ── Step 4: confetti + success state ── */
    setStep("success");
    toast("Post published! 🎉", "success");
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#6C63FF", "#FF6584", "#ffffff"],
    });

    /* ── Step 5: redirect ── */
    setTimeout(() => router.push(`/posts/${post.id}`), 1200);
  }

  const busy = step !== "idle";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0F1A]">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-14 sm:px-6">
        {/* Page title */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="font-heading text-4xl font-bold text-white">
            Write a Post
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Share your story with the ThoughtNest community
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* ── Title ── */}
          <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Give your post a compelling title…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-heading text-xl font-semibold text-white placeholder:font-body placeholder:text-lg placeholder:font-normal placeholder:text-white/20 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </motion.div>

          {/* ── Body ── */}
          <motion.div custom={1} variants={rise} initial="hidden" animate="visible">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Content
              </label>
              <BodyCounter text={body} />
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Write your story here…"
              style={{ minHeight: "400px", resize: "none" }}
              className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/85 placeholder:text-white/20 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </motion.div>

          {/* ── Featured image ── */}
          <motion.div custom={2} variants={rise} initial="hidden" animate="visible">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
              Featured Image{" "}
              <span className="normal-case font-normal tracking-normal text-white/25">
                (optional)
              </span>
            </label>
            <ImageDropZone
              preview={imagePreview}
              onFile={handleFile}
              onRemove={removeImage}
            />
          </motion.div>

          {/* ── AI summary note ── */}
          <motion.div
            custom={3}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3.5"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            <p className="text-xs leading-relaxed text-white/45">
              <span className="font-semibold text-violet-400">AI Summary</span> will be
              auto-generated by Gemini when you publish. It&apos;s stored once and never
              regenerated — keeping API costs minimal.
            </p>
          </motion.div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Actions ── */}
          <motion.div
            custom={4}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="flex gap-3 pt-1"
          >
            <button
              type="button"
              onClick={() => router.back()}
              disabled={busy}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/50 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <MagneticSubmit step={step} disabled={busy} />
          </motion.div>
        </form>
      </div>
    </div>
  );
}

/* ─── Export wrapped in RoleGuard ────────────────────────── */
export default function CreatePostPage() {
  return (
    <RoleGuard
      allowedRoles={["author", "admin"]}
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0F0F1A]">
          <div className="text-center">
            <p className="text-4xl">🔒</p>
            <p className="mt-3 text-white/50">
              You need Author or Admin access to write posts.
            </p>
          </div>
        </div>
      }
    >
      <CreatePostForm />
    </RoleGuard>
  );
}
