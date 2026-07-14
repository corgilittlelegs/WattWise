import { describe, it, expect } from 'vitest';
import { calculateStats, BillDetails } from './types';

describe('calculateStats', () => {
  const bill: BillDetails = {
    lastBillDate: '2026-05-01',
    lastBillReading: 4250,
  };

  it('calculates stats correctly for normal saving scenario', () => {
    // 75 units consumed over 10 days (May 1 to May 10 inclusive is 10 days)
    // Daily free allowance is 10 kWh/day, so 100 kWh free allowance.
    // Units consumed: 4325 - 4250 = 75 kWh.
    // Net savings: 100 - 75 = 25 kWh.
    // Daily average: 75 / 10 = 7.5 kWh/day.
    // Status: 'saving'.
    // Saving percentage: (75 / 100) * 100 = 75%.
    
    const summary = calculateStats(bill, 4325, '2026-05-10');
    
    expect(summary.daysElapsed).toBe(10);
    expect(summary.unitsConsumed).toBe(75);
    expect(summary.freeAllowance).toBe(100);
    expect(summary.unitsSaved).toBe(25);
    expect(summary.dailyAverage).toBe(7.5);
    expect(summary.savingStatus).toBe('saving');
    expect(summary.savingPercentage).toBe(75);
  });

  it('calculates stats correctly for exceeding quota scenario', () => {
    // 120 units consumed over 10 days (May 1 to May 10 inclusive).
    // Free allowance is 100 kWh.
    // Units consumed: 4370 - 4250 = 120 kWh.
    // Net savings: 100 - 120 = -20 kWh (exceeding).
    // Daily average: 120 / 10 = 12 kWh/day.
    // Status: 'exceeding'.
    // Saving percentage: (120 / 100) * 100 = 120%.
    
    const summary = calculateStats(bill, 4370, '2026-05-10');
    
    expect(summary.daysElapsed).toBe(10);
    expect(summary.unitsConsumed).toBe(120);
    expect(summary.freeAllowance).toBe(100);
    expect(summary.unitsSaved).toBe(-20);
    expect(summary.dailyAverage).toBe(12);
    expect(summary.savingStatus).toBe('exceeding');
    expect(summary.savingPercentage).toBe(120);
  });

  it('handles exact quota matching scenario', () => {
    // 100 units consumed over 10 days (May 1 to May 10 inclusive).
    // Free allowance is 100 kWh.
    // Status: 'exact'.
    
    const summary = calculateStats(bill, 4350, '2026-05-10');
    
    expect(summary.unitsSaved).toBe(0);
    expect(summary.savingStatus).toBe('exact');
    expect(summary.savingPercentage).toBe(100);
  });

  it('calculates correctly for 1 day elapsed (same date)', () => {
    // May 1 to May 1 (1 day).
    // Start index: 4250, Reading: 4255. Consumed: 5. Allowance: 10. Savings: 5.
    const summary = calculateStats(bill, 4255, '2026-05-01');
    
    expect(summary.daysElapsed).toBe(1);
    expect(summary.unitsConsumed).toBe(5);
    expect(summary.freeAllowance).toBe(10);
    expect(summary.unitsSaved).toBe(5);
    expect(summary.dailyAverage).toBe(5);
    expect(summary.savingStatus).toBe('saving');
    expect(summary.savingPercentage).toBe(50);
  });
});
