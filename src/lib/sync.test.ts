import { describe, it, expect } from "vitest";
import {
  generateSyncCode,
  isValidSyncKeyFormat,
  validateSyncSessionData,
  mergeReadings,
  mergeArchivedCycles,
  latestReading,
} from "./sync";
import { MeterReading, ArchivedCycle } from "../types";

describe("generateSyncCode", () => {
  it("produces the WATT-XXXX-XXXX-XXXX format", () => {
    const code = generateSyncCode();
    expect(code).toMatch(/^WATT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("does not repeat across many calls (CSPRNG, not deterministic)", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateSyncCode()));
    expect(codes.size).toBe(200);
  });
});

describe("isValidSyncKeyFormat", () => {
  it("accepts a well-formed generated key", () => {
    expect(isValidSyncKeyFormat("WATT-ABCD-EFGH-2J9K")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isValidSyncKeyFormat("watt-abcd-efgh-2j9k")).toBe(true);
  });

  it("rejects short hand-typed keys", () => {
    expect(isValidSyncKeyFormat("WATT-1")).toBe(false);
    expect(isValidSyncKeyFormat("abc123")).toBe(false);
  });

  it("rejects keys missing a segment", () => {
    expect(isValidSyncKeyFormat("WATT-ABCD-EFGH")).toBe(false);
  });
});

describe("validateSyncSessionData", () => {
  const validReading: MeterReading = { id: "r1", date: "2026-05-10", reading: 4325 };

  it("accepts a well-formed document", () => {
    const result = validateSyncSessionData({
      bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 },
      readings: [validReading],
      archivedCycles: [],
      updatedAt: 1234,
    });
    expect(result).not.toBeNull();
    expect(result?.readings).toHaveLength(1);
  });

  it("rejects a missing bill", () => {
    expect(validateSyncSessionData({ readings: [], archivedCycles: [], updatedAt: 1 })).toBeNull();
  });

  it("rejects readings that aren't a list", () => {
    expect(
      validateSyncSessionData({
        bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 },
        readings: "not-a-list",
        archivedCycles: [],
        updatedAt: 1,
      })
    ).toBeNull();
  });

  it("rejects a malformed reading inside the list", () => {
    expect(
      validateSyncSessionData({
        bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 },
        readings: [{ id: "r1", date: "not-a-date", reading: "not-a-number" }],
        archivedCycles: [],
        updatedAt: 1,
      })
    ).toBeNull();
  });

  it("filters out malformed archived cycles instead of failing the whole document", () => {
    const validCycle: ArchivedCycle = {
      id: "c1",
      name: "May",
      bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 },
      readings: [],
      archivedAt: 1,
    };
    const result = validateSyncSessionData({
      bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 },
      readings: [],
      archivedCycles: [validCycle, { bogus: true }],
      updatedAt: 1,
    });
    expect(result?.archivedCycles).toEqual([validCycle]);
  });

  it("rejects non-object input", () => {
    expect(validateSyncSessionData(null)).toBeNull();
    expect(validateSyncSessionData("garbage")).toBeNull();
  });
});

describe("mergeReadings", () => {
  it("keeps same-day readings from both sides (merges by id, not date)", () => {
    const cloud: MeterReading[] = [{ id: "a", date: "2026-05-10", reading: 100 }];
    const local: MeterReading[] = [{ id: "b", date: "2026-05-10", reading: 105 }];
    const merged = mergeReadings(cloud, local);
    expect(merged).toHaveLength(2);
    expect(merged.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("deduplicates the same id, preferring the second argument", () => {
    const cloud: MeterReading[] = [{ id: "a", date: "2026-05-10", reading: 100 }];
    const local: MeterReading[] = [{ id: "a", date: "2026-05-10", reading: 999 }];
    const merged = mergeReadings(cloud, local);
    expect(merged).toHaveLength(1);
    expect(merged[0].reading).toBe(999);
  });

  it("sorts the result chronologically", () => {
    const cloud: MeterReading[] = [{ id: "a", date: "2026-05-20", reading: 200 }];
    const local: MeterReading[] = [{ id: "b", date: "2026-05-10", reading: 100 }];
    const merged = mergeReadings(cloud, local);
    expect(merged.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

describe("mergeArchivedCycles", () => {
  it("deduplicates by id and sorts newest first", () => {
    const older: ArchivedCycle = {
      id: "c1", name: "Apr", bill: { lastBillDate: "2026-04-01", lastBillReading: 4000 }, readings: [], archivedAt: 1,
    };
    const newer: ArchivedCycle = {
      id: "c2", name: "May", bill: { lastBillDate: "2026-05-01", lastBillReading: 4250 }, readings: [], archivedAt: 2,
    };
    const merged = mergeArchivedCycles([older], [newer]);
    expect(merged.map((c) => c.id)).toEqual(["c2", "c1"]);
  });
});

describe("latestReading", () => {
  it("returns the most recently dated reading, not the first in insertion order", () => {
    const readings: MeterReading[] = [
      { id: "a", date: "2026-05-20", reading: 200 },
      { id: "b", date: "2026-05-10", reading: 100 },
      { id: "c", date: "2026-05-28", reading: 300 },
    ];
    expect(latestReading(readings)?.id).toBe("c");
  });

  it("returns null for an empty list", () => {
    expect(latestReading([])).toBeNull();
  });
});
