import { cn } from "@/lib/utils";

const AVATAR_PALETTE = [
  "bg-[#012A38] text-white",
  "bg-teal-700 text-white",
  "bg-blue-700 text-white",
  "bg-violet-700 text-white",
  "bg-amber-800 text-white",
  "bg-rose-700 text-white",
] as const;

export function personInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function paletteIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % 997;
  }
  return hash % AVATAR_PALETTE.length;
}

export function ArContactAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        dim,
        AVATAR_PALETTE[paletteIndex(name)],
        className,
      )}
      aria-hidden
    >
      {personInitials(name)}
    </span>
  );
}
