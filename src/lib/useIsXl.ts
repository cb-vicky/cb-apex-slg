import { useEffect, useState } from "react";

/** Tracks Tailwind `xl` (`min-width: 1280px`) for workspace detail chrome. */
export function useIsXl(): boolean {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setIsXl(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isXl;
}
