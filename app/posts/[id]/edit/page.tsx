"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import RoleGuard from "@/components/RoleGuard";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useToast } from "@/components/Toast";
import Spinner from "@/components/Spinner";

/* ── Stagger variant ─────────────────────────────────────── */
const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ── Image drop zone ────────────────────────────────────── */
function ImageZone({
  preview,
  onFile,
  onRemove,
}: {
  preview: string | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function accept(file: File) {
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Cover" className="h-52 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm hover:bg-black/90 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="absolute bottom-3 left-4 text-xs text-white/50">Cover image</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
      onClick={() => inputRef.current?.click()}
      className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-300 ${
        dragging
          ? "border-violet-400 bg-violet-500/10"
          : "border-white/15 bg-white/3 hover:border-violet-500/50 hover:bg-violet-500/5"
      }`}
    >
      <ImagePlus className={`h-7 w-7 transition-colors ${dragging ? "text-violet-400" : "text-white/25"}`} />
      <p className={`text-sm transition-colors ${dragging ? "text-violet-300" : "text-white/35"}`}>
        {dragging ? "Drop to set cover" : "Drag & drop or click to upload"}
      </p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }} />
    </div>
  );
}

/* ── Inner form (rendered after RoleGuard passes) ────────── */
function EditForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const supabase = createClient();

  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [imageUrl, setImageUrl]     = useState<string | null>(null);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const { toast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 360)}px`;
  }, [body]);

  /* Load post */
  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !data) { router.push("/"); return; }

      /* Author can only edit their own posts */
      if (role === "author" && data.author_id !== user!.id) {
        setUnauthorized(true);
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      setTitle(data.title);
      setBody(data.body);
      setImageUrl(data.image_url ?? null);
      setImagePreview(data.image_url ?? null);
      setLoadingPost(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, role]);

  const handleFile = useCallback((file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSaving(true);

    /* Upload new image if selected */
    let finalImageUrl = imageUrl;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, { upsert: true });
      if (uploadErr) {
        setError("Image upload failed: " + uploadErr.message);
        setSaving(false);
        return;
      }
      finalImageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }

    /*
     * Summary is NOT regenerated here — cost optimization.
     * Summary preserved from original creation (generated once via Gemini at post creation).
     */
    const { error: updateErr } = await supabase
      .from("posts")
      .update({
        title,
        body,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    toast("Post updated successfully!", "success");
    setTimeout(() => router.push(`/posts/${id}`), 1400);
  }

  /* Unauthorized state */
  if (unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-4xl">🔒</p>
          <p className="mt-3 text-white/50">You can only edit your own posts.</p>
          <p className="mt-1 text-xs text-white/25">Redirecting…</p>
        </motion.div>
      </div>
    );
  }

  /* Loading post data */
  if (loadingPost) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0F1A]">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-14 sm:px-6">
        {/* Page title */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="font-heading text-4xl font-bold text-white">Edit Post</h1>
          <p className="mt-2 text-sm text-white/35">
            Changes are saved immediately. AI summary is preserved from creation.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Title */}
          <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-heading text-xl font-semibold text-white focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </motion.div>

          {/* Body */}
          <motion.div custom={1} variants={rise} initial="hidden" animate="visible">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
              Content
            </label>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              style={{ minHeight: "360px", resize: "none" }}
              className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/85 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </motion.div>

          {/* Cover image */}
          <motion.div custom={2} variants={rise} initial="hidden" animate="visible">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
              Cover Image{" "}
              <span className="normal-case font-normal tracking-normal text-white/25">(optional)</span>
            </label>
            <ImageZone preview={imagePreview} onFile={handleFile} onRemove={removeImage} />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <motion.div
            custom={3}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="flex gap-3 pt-1"
          >
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/50 transition-colors hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </motion.button>
          </motion.div>
        </form>
      </div>

    </div>
  );
}

/* ── Export wrapped in RoleGuard ─────────────────────────── */
export default function EditPostPage() {
  return (
    <RoleGuard allowedRoles={["author", "admin"]}>
      <EditForm />
    </RoleGuard>
  );
}
