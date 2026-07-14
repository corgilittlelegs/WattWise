import { BillDetails, MeterReading, calculateStats } from "../types";
import { Zap, ShieldCheck, AlertTriangle } from "lucide-react";

interface InsightsDashboardProps {
  bill: BillDetails;
  readings: MeterReading[];
}

export default function InsightsDashboard({ bill, readings }: InsightsDashboardProps) {
  // If there are no readings, calculate baseline stats using current date model (May 28, 2026) as speculative estimate
  const hasReadings = readings.length > 0;
  
  // Sort readings by date to find latest
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestReading = hasReadings 
    ? sortedReadings[sortedReadings.length - 1] 
    : null;

  const targetDateStr = latestReading ? latestReading.date : "2026-05-28";
  const targetReadingValue = latestReading ? latestReading.reading : bill.lastBillReading;

  const stats = calculateStats(bill, targetReadingValue, targetDateStr);
  
  // Projected 30-day billing period calculations
  const projectedDays = 30;
  const projectedFreeUnits = projectedDays * 10;
  const projectedUsage = stats.dailyAverage * projectedDays;
  const projectedSavings = projectedFreeUnits - projectedUsage;

  const isSaving = stats.unitsSaved >= 0;

  return (
    <div className="space-y-6">
      {/* Prime Header Insight Banner with Efficiency Score details */}
      <div 
        id="insight-hero"
        className={`relative p-6 border rounded-xl transition-all duration-150 ${
          !hasReadings
            ? "bg-white dark:bg-[#121316] border-neutral-200 dark:border-neutral-800"
            : isSaving
            ? "bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-300/80 dark:border-emerald-900/60 shadow-xs dark:shadow-[0_0_30px_rgba(16,185,129,0.04)]"
            : "bg-amber-50/10 dark:bg-amber-950/5 border-amber-300/80 dark:border-amber-900/60 shadow-xs dark:shadow-[0_0_30px_rgba(245,158,11,0.04)]"
        }`}
      >
        {/* Decorative absolute labels */}
        <div className="absolute top-0 right-0 p-6 text-right hidden sm:block select-none pointer-events-none">
          <div className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-widest mb-1 font-mono">Efficiency Rating</div>
          <div className={`text-3xl font-extrabold uppercase tracking-tight ${
            !hasReadings ? "text-neutral-300 dark:text-neutral-600" : isSaving ? "text-emerald-600 dark:text-emerald-450" : "text-amber-600 dark:text-amber-500"
          }`}>
            {!hasReadings ? "PENDING" : stats.unitsSaved >= 15 ? "EXCELLENT" : stats.unitsSaved >= 0 ? "GOOD" : "OVER QUOTA"}
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              {!hasReadings ? (
                <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-sm">
                  Ready to Track
                </span>
              ) : isSaving ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-sm">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  Quota Achieved (Saving)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Over limit
                </span>
              )}
              <span className="text-neutral-400 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-mono">
                {stats.daysElapsed} days logged
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight uppercase">
              {!hasReadings ? (
                "Please add a meter reading to get started!"
              ) : isSaving ? (
                <>
                  Awesome! Saved{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">
                    {stats.unitsSaved.toFixed(1)}
                  </span>{" "}
                  free kWh units
                </>
              ) : (
                <>
                  Consumed{" "}
                  <span className="text-rose-600 dark:text-rose-455 font-mono font-extrabold">
                    {Math.abs(stats.unitsSaved).toFixed(1)}
                  </span>{" "}
                  kWh over free quota
                </>
              )}
            </h2>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              {!hasReadings 
                ? "Your meter checks help monitor the daily 10 units free allowance from the government. Input a reading above to see live updates!"
                : isSaving 
                ? `Your current average consumption of ${stats.dailyAverage.toFixed(2)} kWh per day is under the daily free tier ceiling of 10.0 kWh/day. Keep it up!`
                : `Your daily index is currently ${stats.dailyAverage.toFixed(2)} kWh/day. Turning down high-energy appliances (ACs, heaters) by just a fraction will help pull you back under the limit.`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Performance Indexes (4-column geometry block) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Days Elapsed */}
        <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-xl flex flex-col justify-between min-h-[100px] sm:min-h-[110px] transition-all hover:border-neutral-350 dark:hover:border-neutral-700">
          <div>
            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-1.5 font-mono">
              Days Elapsed
            </span>
            <div className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white font-mono leading-none">
              {stats.daysElapsed} <span className="text-xs text-neutral-400 dark:text-neutral-550 font-sans font-normal lowercase">days</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-6 bg-neutral-900 dark:bg-white rounded-full"></div>
        </div>

        {/* Card 2: Gross Consumed */}
        <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-xl flex flex-col justify-between min-h-[100px] sm:min-h-[110px] transition-all hover:border-neutral-350 dark:hover:border-neutral-700">
          <div>
            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-1.5 font-mono">
              Gross Consumed
            </span>
            <div id="consumed-metric" className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white font-mono leading-none">
              {stats.unitsConsumed.toFixed(1)} <span className="text-xs text-neutral-400 dark:text-neutral-550 font-sans font-normal uppercase">kWh</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-6 bg-amber-500 rounded-full"></div>
        </div>

        {/* Card 3: Free Allowance */}
        <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-xl flex flex-col justify-between min-h-[100px] sm:min-h-[110px] transition-all hover:border-neutral-350 dark:hover:border-neutral-700">
          <div>
            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-1.5 font-mono">
              Free Allowance
            </span>
            <div className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white font-mono leading-none">
              {stats.freeAllowance.toFixed(0)} <span className="text-xs text-neutral-400 dark:text-neutral-550 font-sans font-normal uppercase">kWh</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-6 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
        </div>

        {/* Card 4: Net Savings (Indigo highlighted card) */}
        <div className={`p-4 sm:p-5 rounded-xl flex flex-col justify-between min-h-[100px] sm:min-h-[110px] border transition-all ${
          isSaving 
            ? "border-emerald-500 dark:border-emerald-500 bg-white dark:bg-[#121316]" 
            : "border-amber-500 dark:border-amber-500 bg-white dark:bg-[#121316]"
        }`}>
          <div>
            <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1.5 font-mono ${
              isSaving ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              Net Savings
            </span>
            <div id="savings-title-metric" className={`text-2xl sm:text-3xl font-extrabold font-mono leading-none ${
              isSaving ? "text-emerald-650 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              {isSaving ? "+" : ""}
              {stats.unitsSaved.toFixed(1)} <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal font-sans uppercase">kWh</span>
            </div>
          </div>
          <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-3 uppercase tracking-wider font-mono">
            {isSaving ? "Under quota" : "Over quota"}
          </p>
        </div>
      </div>

      {/* Usage Projection Analysis Banner */}
      <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 rounded-xl transition-colors duration-150">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white mb-5 font-mono">
          Usage &amp; Performance Projection
        </h3>
        
        <div className="space-y-4 max-w-2xl font-mono">
          {/* Average daily row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 w-24 tracking-wider">DAILY INDEX</span>
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.dailyAverage <= 10 ? "bg-neutral-900 dark:bg-white" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, (stats.dailyAverage / 15) * 100)}%` }}
              />
            </div>
            <span id="average-daily-metric" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{stats.dailyAverage.toFixed(2)} kWh/day</span>
          </div>

          {/* Allocation threshold row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 w-24 tracking-wider">ALLOWANCE</span>
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-full overflow-hidden relative">
              <div 
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(10 / 15) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450">10.00 kWh/day</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-850 pt-4 font-sans">
          {stats.dailyAverage > 10 ? (
            <>
              Based on your current consumption of <strong className="text-neutral-800 dark:text-neutral-200">{stats.dailyAverage.toFixed(2)} units</strong> per day, you are trending slightly above the free tier. 
              To remain within the <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">10 units/day</span> threshold, consider adjusting high wattage appliances.
            </>
          ) : (
            <>
              You are maintaining a strong efficiency projection at <strong className="text-emerald-700 dark:text-emerald-400">{stats.dailyAverage.toFixed(2)} units</strong> consumed per day. This is well below the daily free credits allotment.
            </>
          )}
          {" "}
          At this rate, your projected 30-day bill period usage estimate will be <strong id="projected-metric" className="font-mono text-neutral-800 dark:text-neutral-200">{projectedUsage.toFixed(0)} kWh</strong>, saving approx {" "}
          <strong id="projected-savings-badge" className="text-emerald-700 dark:text-emerald-400 font-mono">{projectedSavings.toFixed(0)} kWh</strong> of free credit allowance.
        </p>
      </div>
    </div>
  );
}
