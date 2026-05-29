export function getMainScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-main-scroll-container]");
}
