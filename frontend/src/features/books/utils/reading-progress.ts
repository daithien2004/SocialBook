export function getContentMetrics(contentEl: HTMLElement) {
  const rect = contentEl.getBoundingClientRect();
  const contentTop = rect.top + window.scrollY;
  const totalScrollable = contentEl.offsetHeight - window.innerHeight;
  return { contentTop, totalScrollable };
}

export function getContentProgress(contentEl: HTMLElement): number {
  const { contentTop, totalScrollable } = getContentMetrics(contentEl);
  if (totalScrollable <= 0) {
    return window.scrollY >= contentTop ? 100 : 0;
  }
  const scrolledPast = Math.max(0, window.scrollY - contentTop);
  return Math.min(100, Math.round((scrolledPast / totalScrollable) * 100));
}

export function getContentTargetScroll(savedProgress: number, contentEl: HTMLElement): number {
  const { contentTop, totalScrollable } = getContentMetrics(contentEl);
  if (totalScrollable <= 0) return contentTop;
  return contentTop + (savedProgress / 100) * totalScrollable;
}
