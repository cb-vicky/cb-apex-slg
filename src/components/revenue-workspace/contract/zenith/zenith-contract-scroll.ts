export function getMainScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-main-scroll-container]");
}

export function getZenithStickyChromeElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-zenith-sticky-chrome]");
}
