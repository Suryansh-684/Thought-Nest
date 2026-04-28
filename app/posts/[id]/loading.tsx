export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-12 sm:px-6">
      {/* Hero image */}
      <div className="mb-8 h-[420px] w-full rounded-none bg-white/5 sm:h-[500px]" />

      {/* Back link */}
      <div className="mb-8 h-9 w-36 rounded-xl bg-white/5" />

      {/* Title */}
      <div className="mb-3 h-10 w-4/5 rounded-xl bg-white/8" />
      <div className="mb-6 h-10 w-3/5 rounded-xl bg-white/6" />

      {/* Author row */}
      <div className="mb-10 flex items-center gap-4">
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-4 w-28 rounded bg-white/6" />
        <div className="h-4 w-24 rounded bg-white/5" />
      </div>

      {/* AI summary box */}
      <div className="mb-10 h-24 rounded-2xl bg-white/5" />

      {/* Book reader */}
      <div className="h-[480px] rounded-xl bg-white/4" />

      {/* Comments header */}
      <div className="mt-16 mb-6 h-7 w-32 rounded-xl bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/4" />
    </div>
  );
}
