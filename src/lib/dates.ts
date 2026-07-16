/**
 * Returns today's date as a local-timezone ISO string (YYYY-MM-DD).
 * Avoids the UTC shift of `new Date().toISOString()` for users west of UTC.
 */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
