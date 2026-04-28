export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-white/8" />
        <div className="h-9 w-52 rounded-xl bg-white/8" />
        <div className="ml-auto h-7 w-28 rounded-full bg-white/5" />
      </div>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-6">
            <div className="mb-3 h-3 w-24 rounded bg-white/8" />
            <div className="h-10 w-16 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 rounded-xl bg-white/5" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/8">
        <div className="border-b border-white/8 bg-white/4 px-5 py-3.5">
          <div className="flex gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-20 rounded bg-white/8" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-8 px-5 py-4 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
            <div className="h-4 w-32 rounded bg-white/6" />
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
            <div className="h-7 w-16 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
