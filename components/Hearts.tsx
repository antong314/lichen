export function Hearts({
  count,
  max = 3,
  size = "md",
}: {
  count: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 18 : size === "lg" ? 44 : 28;
  return (
    <div className="flex items-center gap-1.5" aria-label={`${count} of ${max} hearts`}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart key={i} filled={i < count} size={px} />
      ))}
    </div>
  );
}

function Heart({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      className={filled ? "text-rose-500" : "text-stone-300"}
    >
      <path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12c-2.5 4.65-9.5 9-9.5 9z" />
    </svg>
  );
}
