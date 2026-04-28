"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Paragraph-aware page splitter ─────────────────────────── */
const TARGET_CHARS = 600;

function splitIntoPages(body: string): string[] {
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  const pages: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (candidate.length > TARGET_CHARS && current) {
      pages.push(current.trim());
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length ? pages : [body];
}

/* ── Paper page ─────────────────────────────────────────────── */
function Page({
  text,
  pageNum,
  total,
  side,
}: {
  text: string | undefined;
  pageNum: number;
  total: number;
  side: "left" | "right";
}) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden bg-[#F5F0E8] ${
        side === "left" ? "rounded-l-lg" : "rounded-r-lg"
      }`}
      style={{
        boxShadow:
          side === "left"
            ? "inset -4px 0 8px rgba(0,0,0,0.08)"
            : "inset 4px 0 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Subtle paper noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {text ? (
        <>
          <div className="flex-1 overflow-hidden px-8 py-8 pt-10">
            <p className="font-serif text-[15px] leading-[1.85] text-gray-800 whitespace-pre-wrap">
              {text}
            </p>
          </div>
          <div className="px-8 pb-5 text-center text-xs text-gray-400">
            {pageNum} / {total}
          </div>
        </>
      ) : (
        /* Blank verso page */
        <div className="flex flex-1 items-center justify-center">
          <span className="text-3xl opacity-10">🪺</span>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function BookFlipReader({ body }: { body: string }) {
  const pages = splitIntoPages(body);
  const total = pages.length;

  /* spread = index of the LEFT page (always even: 0, 2, 4…) */
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const flipControls = useAnimationControls();

  /* Mobile: single-page swipe */
  const [mobilePage, setMobilePage] = useState(0);

  /* Ensure spread stays in bounds if pages change */
  useEffect(() => { setSpread(0); setMobilePage(0); }, [body]);

  const leftText  = pages[spread];
  const rightText = pages[spread + 1];
  const canNext = spread + 2 < total;
  const canPrev = spread > 0;

  async function flipNext() {
    if (!canNext || flipping) return;
    setFlipping(true);
    await flipControls.start({
      rotateY: -180,
      transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    });
    setSpread((s) => s + 2);
    flipControls.set({ rotateY: 0 });
    setFlipping(false);
  }

  async function flipPrev() {
    if (!canPrev || flipping) return;
    setFlipping(true);
    await flipControls.start({
      rotateY: 180,
      transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    });
    setSpread((s) => s - 2);
    flipControls.set({ rotateY: 0 });
    setFlipping(false);
  }

  /* Progress dots — one per spread */
  const spreadCount = Math.ceil(total / 2);
  const currentSpreadIdx = Math.floor(spread / 2);

  /* ── Single-page fallback (very short posts) ── */
  if (total === 1) {
    return (
      <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-[#F5F0E8] px-8 py-10 shadow-2xl shadow-black/40">
        <p className="font-serif text-[15px] leading-[1.85] text-gray-800 whitespace-pre-wrap">
          {pages[0]}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10 select-none">
      {/* ── Header ── */}
      <div className="mb-4 flex items-center gap-2 text-xs text-white/30">
        <BookOpen className="h-3.5 w-3.5" />
        <span>
          Pages {spread + 1}–{Math.min(spread + 2, total)} of {total}
        </span>
      </div>

      {/* ── Desktop: open book ── */}
      <div
        className="hidden md:block"
        style={{ perspective: "1200px" }}
      >
        <div className="relative flex h-[480px] w-full overflow-hidden rounded-xl shadow-2xl shadow-black/50">
          {/* Spine shadow */}
          <div className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-black/20 shadow-[0_0_12px_rgba(0,0,0,0.3)]" />

          {/* Left page */}
          <div className="relative w-1/2 overflow-hidden">
            <Page
              text={leftText}
              pageNum={spread + 1}
              total={total}
              side="left"
            />
          </div>

          {/* Right page — this is the one that flips */}
          <div className="relative w-1/2 overflow-hidden" style={{ transformStyle: "preserve-3d" }}>
            <motion.div
              animate={flipControls}
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
              className="h-full w-full"
            >
              {/* Front face */}
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                <Page
                  text={rightText}
                  pageNum={spread + 2}
                  total={total}
                  side="right"
                />
              </div>
              {/* Back face (next left page revealed during flip) */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Page
                  text={pages[spread + 2]}
                  pageNum={spread + 3}
                  total={total}
                  side="left"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Desktop controls ── */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={flipPrev}
            disabled={!canPrev || flipping}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/50 transition-all hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: spreadCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { if (!flipping) setSpread(i * 2); }}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSpreadIdx
                    ? "h-2 w-6 bg-violet-500"
                    : i < currentSpreadIdx
                    ? "h-2 w-2 bg-violet-500/40"
                    : "h-2 w-2 bg-white/15"
                }`}
              />
            ))}
          </div>

          <button
            onClick={flipNext}
            disabled={!canNext || flipping}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/50 transition-all hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile: single page + swipe ── */}
      <MobileSinglePage
        pages={pages}
        mobilePage={mobilePage}
        setMobilePage={setMobilePage}
      />
    </div>
  );
}

/* ── Mobile swipe reader ────────────────────────────────────── */
function MobileSinglePage({
  pages,
  mobilePage,
  setMobilePage,
}: {
  pages: string[];
  mobilePage: number;
  setMobilePage: (n: number) => void;
}) {
  const total = pages.length;
  const dragStartX = useRef(0);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -50 && mobilePage < total - 1) {
      setMobilePage(mobilePage + 1);
    } else if (info.offset.x > 50 && mobilePage > 0) {
      setMobilePage(mobilePage - 1);
    }
  }

  return (
    <div className="md:hidden">
      <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        <motion.div
          key={mobilePage}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="min-h-[420px] bg-[#F5F0E8] px-7 py-9">
            <p className="font-serif text-[15px] leading-[1.85] text-gray-800 whitespace-pre-wrap">
              {pages[mobilePage]}
            </p>
            <p className="mt-6 text-center text-xs text-gray-400">
              {mobilePage + 1} / {total}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setMobilePage(Math.max(0, mobilePage - 1))}
          disabled={mobilePage === 0}
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <div className="flex gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setMobilePage(i)}
              className={`rounded-full transition-all ${
                i === mobilePage ? "h-2 w-5 bg-violet-500" : "h-2 w-2 bg-white/15"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setMobilePage(Math.min(total - 1, mobilePage + 1))}
          disabled={mobilePage === total - 1}
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 disabled:opacity-30"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
