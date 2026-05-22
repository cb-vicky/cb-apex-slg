import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DetailNavItem } from "./workspace-detail-nav";

/** Clearance below sticky CustomerContextBar tabs when nav pins on scroll */
const STICKY_OFFSET_BELOW_TABS = 32;

interface Props {
  items: DetailNavItem[];
}

export function WorkspaceDetailNav({ items }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [stickyTop, setStickyTop] = useState(STICKY_OFFSET_BELOW_TABS + 140);
  const navRef = useRef<HTMLElement>(null);
  const clickingRef = useRef(false);

  useEffect(() => {
    const chrome = document.querySelector("[data-insight-rail-anchor]");
    if (!chrome) return;

    const updateTop = () => {
      setStickyTop(chrome.getBoundingClientRect().height + STICKY_OFFSET_BELOW_TABS);
    };

    updateTop();
    const observer = new ResizeObserver(updateTop);
    observer.observe(chrome);
    return () => observer.disconnect();
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
