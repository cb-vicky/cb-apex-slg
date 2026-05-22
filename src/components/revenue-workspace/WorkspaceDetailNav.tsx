import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DetailNavItem } from "./workspace-detail-nav";

/** Gap between the workspace tab strip and the pinned in-page nav */
const STICKY_OFFSET_BELOW_TABS = 24;

export type WorkspaceDetailNavVariant = "default" | "notion";

interface Props {
  items: DetailNavItem[];
  variant?: WorkspaceDetailNavVariant;
}

export function WorkspaceDetailNav({ items, variant = "default" }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [stickyTop, setStickyTop] = useState(STICKY_OFFSET_BELOW_TABS + 140);
  const navRef = useRef<HTMLElement>(null);
  const clickingRef = useRef(false);

  useEffect(() => {
    const tabsStrip = document.querySelector("[data-tabs-anchor]");
    const scrollRoot = document.querySelector("[data-main-scroll-container]");
    const chrome = document.querySelector("[data-insight-rail-anchor]");
    if (!tabsStrip || !scrollRoot) return;

    const updateTop = () => {
      const strip = tabsStrip.getBoundingClientRect();
      const root = scrollRoot.getBoundingClientRect();
      setStickyTop(
        Math.max(0, strip.bottom - root.top + STICKY_OFFSET_BELOW_TABS),
      );
    };

    updateTop();
    const observer = new ResizeObserver(updateTop);
    observer.observe(tabsStrip);
    if (chrome) observer.observe(chrome);
    scrollRoot.addEventListener("scroll", updateTop, { passive: true });
    window.addEventListener("resize", updateTop);
    return () => {
      observer.disconnect();
      scrollRoot.removeEventListener("scroll", updateTop);
      window.removeEventListener("resize", updateTop);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    clickingRef.current = true;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      clickingRef.current = false;
    }, 600);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    setActiveId((prev) => (items.some((i) => i.id === prev) ? prev : items[0].id));
  }, [items]);

  useEffect(() => {
    if (items.length === 0) return;

    const scrollRoot = document.querySelector("[data-main-scroll-container]");
    const sectionEls = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) {
          setActiveId(top.target.id);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of sectionEls) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  if (variant === "notion") {
    return (
      <NotionStyleDetailNav
        ref={navRef}
        items={items}
        activeId={activeId}
        stickyTop={stickyTop}
        onSelect={scrollToSection}
      />
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label="Page sections"
      className="sticky z-10 w-[160px] shrink-0 self-start"
      style={{ top: stickyTop }}
    >
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "block w-full text-left text-[12px] leading-snug transition-[color,font-weight] duration-150",
                  isActive
                    ? "font-bold text-gray-900"
                    : "font-normal text-gray-500 hover:font-semibold hover:text-gray-900",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface NotionNavProps {
  items: DetailNavItem[];
  activeId: string;
  stickyTop: number;
  onSelect: (id: string) => void;
}

const NOTION_LINE_GAP = "gap-[8px]";

function notionLineClass(isActive: boolean) {
  return cn(
    "block h-0.5 shrink-0 rounded-full transition-all duration-150",
    isActive ? "w-7 bg-blue-600" : "w-6 bg-gray-300",
  );
}

const NotionStyleDetailNav = forwardRef<HTMLElement, NotionNavProps>(function NotionStyleDetailNav(
  { items, activeId, stickyTop, onSelect },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Page sections"
      className="group/nav relative sticky z-10 w-7 shrink-0 self-start"
      style={{ top: stickyTop }}
    >
      {/* Collapsed line rail — 8px between lines, hidden when popover is open */}
      <ul
        className={cn(
          "flex flex-col",
          NOTION_LINE_GAP,
          "transition-opacity duration-150",
          "group-hover/nav:pointer-events-none group-hover/nav:opacity-0",
          "group-focus-within/nav:pointer-events-none group-focus-within/nav:opacity-0",
        )}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                title={item.label}
                aria-current={isActive ? "true" : undefined}
                className="flex w-full items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/80"
              >
                <span className={notionLineClass(isActive)} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Popover overlays the line rail (same origin), expanding right with labels */}
      <div
        className={cn(
          "absolute left-0 top-0 z-20 min-w-[168px] max-w-[200px]",
          "pointer-events-none opacity-0",
          "transition-opacity duration-150 ease-out",
          "group-hover/nav:pointer-events-auto group-hover/nav:opacity-100",
          "group-focus-within/nav:pointer-events-auto group-focus-within/nav:opacity-100",
        )}
      >
        <ul
          className={cn(
            "flex flex-col gap-0.5 rounded-lg border border-gray-200/70 bg-white/95 px-3 py-2.5",
            "shadow-[0_2px_12px_rgba(15,23,42,0.06)] backdrop-blur-sm",
          )}
        >
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "block w-full rounded-md px-1 py-1 text-left text-[12px] leading-snug transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/80",
                    isActive
                      ? "font-semibold text-gray-900"
                      : "font-normal text-gray-500 hover:text-gray-900",
                  )}
                >
                  <span className="min-w-0 truncate whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
});
