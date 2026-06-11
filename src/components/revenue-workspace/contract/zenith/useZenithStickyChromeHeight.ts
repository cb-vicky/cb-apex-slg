import { useLayoutEffect, useState } from "react";
import { getZenithStickyChromeElement } from "./zenith-contract-scroll";

/** Height of the sticky CustomerContextBar chrome in Zenith contract view. */
export function useZenithStickyChromeHeight(): number {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = getZenithStickyChromeElement();
    if (!el) {
      setHeight(0);
      return;
    }

    const update = () => setHeight(el.getBoundingClientRect().height);

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
