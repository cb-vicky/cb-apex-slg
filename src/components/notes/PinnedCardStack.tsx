import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StackedPinnedNoteCard, type StackedPinnedCardData } from "./StackedPinnedNoteCard";

interface PinnedCardStackProps {
  cards: StackedPinnedCardData[];
  onNavigate: (id: string) => void;
  onTogglePin: (id: string) => void;
  unpinTitle?: string;
  /** When true, hover expansion overlays content below (e.g. workspace tabs). */
  overlayOnHover?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}

export function PinnedCardStack({
  cards,
  onNavigate,
  onTogglePin,
  unpinTitle,
  overlayOnHover = false,
  onHoverChange,
}: PinnedCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleHoverChange = (hovered: boolean) => {
    setIsHovered(hovered);
    onHoverChange?.(hovered);
  };

  useEffect(() => {
    if (currentIndex >= cards.length && cards.length > 0) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  if (cards.length === 0) {
    return null;
  }

  const handleNavigate = (newIndex: number) => {
    if (isAnimating || newIndex === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
    handleNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === cards.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(newIndex);
  };

  const visibleStackCount = Math.min(cards.length, 3);
  const stackHeight = 44 + (visibleStackCount - 1) * 5;
  const hasMultiple = cards.length > 1;

  const getStackPosition = (idx: number): number => {
    if (idx === currentIndex) return 0;

    const len = cards.length;
    const diff = idx - currentIndex;
    const normalizedDiff = ((diff % len) + len) % len;

    if (normalizedDiff <= visibleStackCount - 1) {
      return normalizedDiff;
    }

    return visibleStackCount;
  };

  return (
    <div className={cn("flex gap-2", hasMultiple ? "items-stretch" : "")}>
      <div
        className={cn(
          "relative",
          hasMultiple ? "flex-1" : "w-full",
          overlayOnHover && isHovered && "z-50 overflow-visible",
        )}
        style={{ height: `${stackHeight}px` }}
      >
        {cards.map((card, idx) => {
          const stackPosition = getStackPosition(idx);
          const isVisible = stackPosition < visibleStackCount;

          if (!isVisible) return null;

          return (
            <StackedPinnedNoteCard
              key={card.id}
              card={card}
              onNavigate={() => onNavigate(card.id)}
              onTogglePin={() => onTogglePin(card.id)}
              isActive={idx === currentIndex}
              stackIndex={stackPosition}
              totalCount={visibleStackCount}
              unpinTitle={unpinTitle}
              overlayOnHover={overlayOnHover}
              onHoverChange={idx === currentIndex ? handleHoverChange : undefined}
            />
          );
        })}
      </div>

      {hasMultiple ? (
        <div className="flex flex-col items-center justify-center gap-0 px-0.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isAnimating}
            className="rounded p-0 text-blue-400 transition-colors hover:text-blue-600 disabled:opacity-50"
            aria-label="Previous"
          >
            <ChevronUp size={12} />
          </button>

          {cards.length <= 3 ? (
            <div className="flex flex-col items-center gap-0.5">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleNavigate(idx)}
                  disabled={isAnimating}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    idx === currentIndex
                      ? "h-1.5 w-1.5 bg-blue-500"
                      : "h-1 w-1 bg-blue-300 hover:bg-blue-400",
                  )}
                  aria-label={`Go to item ${idx + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-[9px] font-medium tabular-nums leading-none text-blue-500">
              {currentIndex + 1}/{cards.length}
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isAnimating}
            className="rounded p-0 text-blue-400 transition-colors hover:text-blue-600 disabled:opacity-50"
            aria-label="Next"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
