const MS = 1;
const SEC = 1000 * MS;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isLocalYesterday(earlier: Date, now: Date) {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return isSameLocalDay(earlier, y);
}

function calendarDaysBetween(earlier: Date, later: Date) {
  const t =
    (startOfLocalDay(later).getTime() - startOfLocalDay(earlier).getTime()) / DAY;
  return Math.floor(t);
}

/**
 * e.g. "12 mins ago", "2 hours ago", "yesterday", "5 days ago", "last week", "Mar 23".
 */
export function formatSessionRelativeTime(at: Date, now: Date) {
  if (at.getTime() > now.getTime()) return "just now";
  if (isSameLocalDay(at, now)) {
    const diff = now.getTime() - at.getTime();
    if (diff < MIN) return "just now";
    if (diff < HOUR) {
      const m = Math.floor(diff / MIN);
      return m === 1 ? "1 min ago" : `${m} mins ago`;
    }
    const h = Math.floor(diff / HOUR);
    return h === 1 ? "1 hour ago" : `${h} hours ago`;
  }
  if (isLocalYesterday(at, now)) return "yesterday";
  const d = calendarDaysBetween(at, now);
  if (d >= 2 && d <= 6) return `${d} days ago`;
  if (d >= 7 && d <= 14) return "last week";
  if (at.getFullYear() === now.getFullYear()) {
    return at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return at.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
