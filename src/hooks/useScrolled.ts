import { useEffect, useRef, useState } from "react";

function findScrollContainer(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflow + overflowY)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Returns a ref to attach to an element and a boolean indicating whether
 * the nearest scrollable ancestor (or the element itself if scrollable)
 * has been scrolled past the given threshold.
 */
export function useScrolled(threshold = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { overflow, overflowY } = getComputedStyle(el);
    const isSelf = /(auto|scroll)/.test(overflow + overflowY);
    const container = isSelf ? el : findScrollContainer(el);
    if (!container) return;

    const check = () => setIsScrolled(container.scrollTop > threshold);
    container.addEventListener("scroll", check, { passive: true });
    check();
    return () => container.removeEventListener("scroll", check);
  }, [threshold]);

  return { ref, isScrolled };
}
