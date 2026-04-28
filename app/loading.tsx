import SkeletonCard from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Hero placeholder */}
      <div className="mb-16 flex flex-col items-center gap-4">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-5 w-80 animate-pulse rounded-xl bg-white/4" />
        <div className="mt-2 flex gap-3">
          <div className="h-11 w-36 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-11 w-36 animate-pulse rounded-2xl bg-white/4" />
        </div>
      </div>

      {/* Post grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
