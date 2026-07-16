import { ArchivedCycle, BillDetails, MeterReading } from "../types";

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L
const KEY_PATTERN = /^WATT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** Generates a sync key using a CSPRNG: WATT-XXXX-XXXX-XXXX (~1e18 keyspace). */
export function generateSyncCode(): string {
  const part = (length: number): string => {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => KEY_CHARS[b % KEY_CHARS.length]).join("");
  };
  return `WATT-${part(4)}-${part(4)}-${part(4)}`;
}

/** True only for full-format generated keys — rejects short/guessable manual input. */
export function isValidSyncKeyFormat(key: string): boolean {
  return KEY_PATTERN.test(key.trim().toUpperCase());
}

export function normalizeSyncKey(key: string): string {
  return key.trim().toUpperCase();
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isIsoDateString(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isValidBill(v: unknown): v is BillDetails {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  return isIsoDateString(b.lastBillDate) && isFiniteNumber(b.lastBillReading);
}

function isValidReading(v: unknown): v is MeterReading {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    isIsoDateString(r.date) &&
    isFiniteNumber(r.reading) &&
    (r.notes === undefined || typeof r.notes === "string")
  );
}

function isValidArchivedCycle(v: unknown): v is ArchivedCycle {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.name === "string" &&
    isValidBill(c.bill) &&
    Array.isArray(c.readings) &&
    c.readings.every(isValidReading) &&
    isFiniteNumber(c.archivedAt)
  );
}

export interface ValidatedSyncSessionData {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles: ArchivedCycle[];
  updatedAt: number;
}

/**
 * Validates and narrows an untrusted Firestore document (writable by anyone
 * holding the sync key) before it ever reaches setState. Returns null for
 * anything malformed instead of throwing, so a bad remote doc can't crash
 * the app or wipe local state.
 */
export function validateSyncSessionData(data: unknown): ValidatedSyncSessionData | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (!isValidBill(d.bill)) return null;
  if (!Array.isArray(d.readings) || !d.readings.every(isValidReading)) return null;

  const archivedCycles = Array.isArray(d.archivedCycles)
    ? d.archivedCycles.filter(isValidArchivedCycle)
    : [];

  const updatedAt = isFiniteNumber(d.updatedAt) ? d.updatedAt : 0;

  return {
    bill: d.bill,
    readings: d.readings,
    archivedCycles,
    updatedAt,
  };
}

/** Merges readings by id (not date) so same-day entries are never dropped. */
export function mergeReadings(a: MeterReading[], b: MeterReading[]): MeterReading[] {
  const map = new Map<string, MeterReading>();
  a.forEach((r) => map.set(r.id, r));
  b.forEach((r) => map.set(r.id, r));
  return Array.from(map.values()).sort(
    (x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()
  );
}

/** Merges archived cycles by id, deduplicating. */
export function mergeArchivedCycles(a: ArchivedCycle[], b: ArchivedCycle[]): ArchivedCycle[] {
  const map = new Map<string, ArchivedCycle>();
  a.forEach((c) => map.set(c.id, c));
  b.forEach((c) => map.set(c.id, c));
  return Array.from(map.values()).sort((x, y) => y.archivedAt - x.archivedAt);
}

/** Returns the most recently logged reading (by date), or null if empty. */
export function latestReading(readings: MeterReading[]): MeterReading | null {
  if (readings.length === 0) return null;
  return [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}
