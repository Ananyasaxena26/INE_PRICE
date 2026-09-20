export const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

export const dateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export const seconds = (ms) => (ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`);

export function timeAgo(iso) {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// when the next scheduled scrape is expected (last attempt + interval)
export function nextScrape(lastAttemptIso, intervalMinutes) {
  if (!lastAttemptIso) return "waiting for first scrape";
  const ms = new Date(lastAttemptIso).getTime() + (intervalMinutes || 120) * 60000 - Date.now();
  if (ms <= 0) return "due now";
  const m = Math.round(ms / 60000);
  return m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)}h ${m % 60}m`;
}

export function stockLabel(inStock, qty) {
  if (inStock === true) return qty != null ? `In stock (${qty})` : "In stock";
  if (inStock === false) return "Out of stock";
  return "—";
}
