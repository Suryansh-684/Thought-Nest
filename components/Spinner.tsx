export default function Spinner({ size = 8 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}
