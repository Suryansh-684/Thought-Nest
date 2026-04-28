"use client";

export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/4">
      {/* Image area */}
      <div className="relative h-48 w-full overflow-hidden bg-white/5">
        <Shimmer />
      </div>

      <div className="p-5">
        {/* AI badge + date row */}
        <div className="mb-3 flex items-center gap-2">
          <div className="relative h-5 w-20 overflow-hidden rounded-full bg-white/8">
            <Shimmer />
          </div>
          <div className="relative h-3 w-16 overflow-hidden rounded bg-white/6">
            <Shimmer delay="0.15s" />
          </div>
        </div>

        {/* Title */}
        <div className="relative mb-1.5 h-5 w-4/5 overflow-hidden rounded bg-white/8">
          <Shimmer delay="0.05s" />
        </div>
        <div className="relative mb-4 h-5 w-3/5 overflow-hidden rounded bg-white/6">
          <Shimmer delay="0.1s" />
        </div>

        {/* Summary lines */}
        <div className="relative mb-1.5 h-3.5 w-full overflow-hidden rounded bg-white/6">
          <Shimmer delay="0.2s" />
        </div>
        <div className="relative mb-4 h-3.5 w-5/6 overflow-hidden rounded bg-white/5">
          <Shimmer delay="0.25s" />
        </div>

        {/* Author row */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/8">
            <Shimmer delay="0.3s" />
          </div>
          <div className="relative h-3 w-24 overflow-hidden rounded bg-white/6">
            <Shimmer delay="0.35s" />
          </div>
          <div className="ml-auto relative h-7 w-16 overflow-hidden rounded-lg bg-white/6">
            <Shimmer delay="0.4s" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Shimmer({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: `shimmer 1.8s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}

/* Inject keyframe once — safe to repeat in multiple instances */
if (typeof document !== "undefined") {
  const id = "__tn_shimmer__";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
    document.head.appendChild(s);
  }
}
