export interface BillDetails {
  lastBillDate: string; // ISO yyyy-mm-dd
  lastBillReading: number; // kWh
}

export interface MeterReading {
  id: string;
  date: string; // ISO yyyy-mm-dd
  reading: number; // kWh
  notes?: string;
}

export interface ArchivedCycle {
  id: string;
  name: string; // e.g. "May 1, 2026 - Jun 30, 2026"
  bill: BillDetails;
  readings: MeterReading[];
  archivedAt: number; // timestamp
}

export interface ConsumptionSummary {
  daysElapsed: number;
  unitsConsumed: number;
  freeAllowance: number;
  unitsSaved: number;
  dailyAverage: number;
  savingStatus: 'saving' | 'exceeding' | 'exact';
  savingPercentage: number; // percentage of allowance used or saved
}

export function calculateStats(
  bill: BillDetails,
  reading: number,
  readingDateStr: string
): ConsumptionSummary {
  const [y1, m1, d1] = bill.lastBillDate.split("-").map(Number);
  const [y2, m2, d2] = readingDateStr.split("-").map(Number);
  const date1UTC = Date.UTC(y1, m1 - 1, d1);
  const date2UTC = Date.UTC(y2, m2 - 1, d2);
  
  // Calculate difference in milliseconds, then convert to days (inclusive)
  const diffTime = date2UTC - date1UTC;
  const daysElapsed = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  
  const unitsConsumed = Math.max(0, reading - bill.lastBillReading);
  const freeAllowance = daysElapsed * 10;
  const unitsSaved = freeAllowance - unitsConsumed;
  const dailyAverage = daysElapsed > 0 ? unitsConsumed / daysElapsed : 0;
  
  let savingStatus: 'saving' | 'exceeding' | 'exact' = 'exact';
  if (unitsSaved > 0) {
    savingStatus = 'saving';
  } else if (unitsSaved < 0) {
    savingStatus = 'exceeding';
  }
  
  // Percentage of allowance consumed
  const savingPercentage = freeAllowance > 0 
    ? Math.min(200, (unitsConsumed / freeAllowance) * 100)
    : 100;

  return {
    daysElapsed,
    unitsConsumed,
    freeAllowance,
    unitsSaved,
    dailyAverage,
    savingStatus,
    savingPercentage
  };
}

export const INITIAL_BILL_DETAILS: BillDetails = {
  lastBillDate: "2026-05-01",
  lastBillReading: 4250,
};

export const INITIAL_METER_READINGS: MeterReading[] = [
  {
    id: "reading-1",
    date: "2026-05-10",
    reading: 4325, // 75 units consumed in 9 days. Allowance: 90 units. Saved: 15 units.
    notes: "First check. Doing great!"
  },
  {
    id: "reading-2",
    date: "2026-05-20",
    reading: 4410, // 160 units consumed in 19 days. Allowance: 190 units. Saved: 30 units.
    notes: "Week after hot climate, usage is stable."
  },
  {
    id: "reading-3",
    date: "2026-05-28", // Today represents 27 days since bill date
    reading: 4492, // 242 units consumed in 27 days. Allowance: 270 units. Saved: 28 units.
    notes: "Today's meter check."
  }
];
