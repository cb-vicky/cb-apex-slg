import { useState } from "react";
import { Pin } from "lucide-react";
import { cn, shortDate } from "@/lib/utils";

export interface StackedPinnedCardData {
  id: string;
  text: string;
  authorName: string;
  timestamp: string;
  locationLabel?: string;
}

interface StackedPinnedNoteCardProps {
  card: StackedPinnedCardData;
  onNavigate: () => void;
  onTogglePin: () => void;
  isActive: boolean;
  stackIndex: number;
  totalCount: number;
  unpinTitle?: string;
  /** When true, hover expansion overlays content below (e.g. workspace tabs). */
  overlayOnHover?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}

export function StackedPinnedNoteCard({
  card,
  onNavigate,
  onTogglePin,
  isActive,
  stackIndex,
  totalCount,
  unpinTitle = "Unpin",
  overlayOnHover = false,
  onHoverChange,
}: StackedPinnedNoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHoverChange = (hovered: boolean) => {
    setIsHovered(hovered);
    onHoverChange?.(hovered);
  };

  const initials = card.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const stackOffset = stackIndex * 5;
  const stackScale = 1 - stackIndex * 0.03;

  return (
    <div
      className={cn(
        "group absolute inset-x-0 top-0 w-full rounded-xl border px-3 py-2.5 text-left cursor-pointer",
        isActive
          ? "border-blue-200 bg-blue-50 shadow-sm hover:border-blue-300 hover:bg-blue-100"
          : "border-blue-200 bg-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] pointer-events-none",
        overlayOnHover && isActive && isHovered && "shadow-md",
      )}
      style={{
        transform: `translateY(${stackOffset}px) scale(${stackScale})`,
        zIndex:
          overlayOnHover && isActive && isHovered
            ? 50
            : totalCount - stackIndex,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
      }}
      onClick={isActive ? onNavigate : undefined}
      onMouseEnter={() => handleHoverChange(true)}
      onMouseLeave={() => handleHoverChange(false)}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={
        isActive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onNavigate();
            }
          : undefined
      }
    >
      <div className="flex items-start gap-2.5 pr-8">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] font-medium leading-snug text-blue-900 transition-all duration-200",
              isActive && isHovered ? "line-clamp-none" : "line-clamp-1",
            )}
          >
            {card.text}
          </p>
        </div>
      </div>

      {isActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="absolute top-2.5 right-2.5 rounded-md p-1 text-blue-600 transition-colors hover:bg-blue-100"
          title={unpinTitle}
        >
          <Pin size={12} fill="currentColor" />
        </button>
      )}

      {isActive && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-blue-200/50 pt-1.5 mt-1.5 text-[11px] text-blue-500 transition-all duration-200",
            isHovered
              ? overlayOnHover
                ? "opacity-100 max-h-none"
                : "opacity-100 max-h-10"
              : "opacity-0 max-h-0 overflow-hidden mt-0 pt-0 border-t-0",
          )}
        >
          <span className="font-medium text-blue-700">{card.authorName}</span>
          <span>·</span>
          <span>{shortDate(card.timestamp)}</span>
          {card.locationLabel ? (
            <>
              <span>·</span>
              <span className="text-blue-600">{card.locationLabel}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
