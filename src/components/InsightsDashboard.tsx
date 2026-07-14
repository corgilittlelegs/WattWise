import { BillDetails, MeterReading, calculateStats } from "../types";
import { Zap, ShieldCheck, AlertTriangle, TrendingUp, Sparkles, HelpCircle } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Prime Header Insight Banner with Efficiency Score details */}
      <div 
        id="insight-hero"
        className={`relative p-6 border transition-all duration-150 ${
          !hasReadings
            ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            : stats.unitsSaved >= 0
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-850"
            : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-850"
        }`}
      >
        {/* Subtle decorative absolute labels consistent with Geometric Balance */}
        <div className="absolute top-0 right-0 p-6 text-right hidden sm:block select-none pointer-events-none">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-1">Efficiency Rating</div>
          <div className={`text-4xl font-bold uppercase tracking-tight ${
            !hasReadings ? "text-slate-350 dark:text-slate-650" : stats.unitsSaved >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"
          }`}>
            {!hasReadings ? "PENDING" : stats.unitsSaved >= 15 ? "EXCELLENT" : stats.unitsSaved >= 0 ? "GOOD" : "OVER QUOTA"}
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              {!hasReadings ? (
                <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  Ready to Track
                </span>
              ) : stats.unitsSaved >= 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  Quota Achieved (Saving)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-305">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Over limit
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">
                {stats.daysElapsed} days logged balance
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
              {!hasReadings ? (
                "Please add a meter reading to get started!"
              ) : stats.unitsSaved >= 0 ? (
                <>
                  Awesome! Saved{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {stats.unitsSaved.toFixed(1)}
                  </span>{" "}
                  free kWh units
                </>
              ) : (
                <>
                  Consumed{" "}
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                    {Math.abs(stats.unitsSaved).toFixed(1)}
                  </span>{" "}
                  kWh over free quota
                </>
              )}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {!hasReadings 
                ? "Your meter checks help monitor the daily 10 units free allowance from the government. Input a reading above to see live updates!"
                : stats.unitsSaved >= 0 
                ? `Your current average consumption of ${stats.dailyAverage.toFixed(2)} kWh per day is under the daily free tier ceiling of 10.0 kWh/day. Keep it up!`
                : `Your daily index is currently ${stats.dailyAverage.toFixed(2)} kWh/day. Turning down high-energy appliances (ACs, heaters) by just a fraction will help pull you back under the limit.`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Performance Indexes (4-column geometry block) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Days Elapsed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 flex flex-col justify-between min-h-[120px] transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Days Elapsed
            </span>
            <div className="text-3xl font-light text-slate-900 dark:text-white font-mono">
              {stats.daysElapsed} <span className="text-sm text-slate-400 dark:text-slate-500 font-sans font-normal">Days</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-indigo-505 dark:bg-indigo-500"></div>
        </div>

        {/* Card 2: Gross Consumed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-5 flex flex-col justify-between min-h-[120px] transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Gross Consumed
            </span>
            <div id="consumed-metric" className="text-3xl font-light text-slate-900 dark:text-white font-mono">
              {stats.unitsConsumed.toFixed(1)} <span className="text-sm text-slate-400 dark:text-slate-500 font-sans font-normal">kWh</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-amber-500"></div>
        </div>

        {/* Card 3: Free Allowance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 p-5 flex flex-col justify-between min-h-[120px] transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Free Allowance
            </span>
            <div className="text-3xl font-light text-slate-900 dark:text-white font-mono">
              {stats.freeAllowance.toFixed(0)} <span className="text-sm text-slate-400 dark:text-slate-505 font-sans font-normal">kWh</span>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-slate-300 dark:bg-slate-600"></div>
        </div>

        {/* Card 4: Net Savings (Indigo highlighted card) */}
        <div className={`p-5 flex flex-col justify-between min-h-[120px] border-2 transition-all ${
          stats.unitsSaved >= 0 
            ? "border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900" 
            : "border-amber-500 dark:border-amber-505 bg-white dark:bg-slate-900"
        }`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
              stats.unitsSaved >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            }`}>
              Net Savings
            </span>
            <div id="savings-title-metric" className={`text-3xl font-bold font-mono ${
              stats.unitsSaved >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              {stats.unitsSaved >= 0 ? "+" : ""}
              {stats.unitsSaved.toFixed(1)} <span className="text-xs text-slate-400 dark:text-slate-550 font-normal font-sans">kWh</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">
            {stats.unitsSaved >= 0 ? "Below quota projection" : "Exceeded free units limit"}
          </p>
        </div>
      </div>

      {/* Usage Projection Analysis Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors duration-150">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-955 dark:text-white mb-4">
          Usage &amp; Performance Projection
        </h3>
        
        <div className="space-y-4 max-w-2xl">
          {/* Average daily row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 w-24 tracking-wider">DAILY INDEX</span>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 ${
                  stats.dailyAverage <= 10 ? "bg-slate-900 dark:bg-slate-400" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, (stats.dailyAverage / 15) * 100)}%` }}
              />
            </div>
            <span id="average-daily-metric" className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{stats.dailyAverage.toFixed(2)} kWh/day</span>
          </div>

          {/* Allocation threshold row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 w-24 tracking-wider">ALLOWANCE</span>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
              <div 
                className="h-full bg-emerald-500"
                style={{ width: `${(10 / 15) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">10.00 kWh/day</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
          {stats.dailyAverage > 10 ? (
            <>
              Based on your current consumption of <strong className="text-slate-800 dark:text-slate-200">{stats.dailyAverage.toFixed(2)} units</strong> per day, you are trending slightly above the free tier. 
              To remain within the <span className="text-indigo-600 dark:text-indigo-400 font-bold">10 units/day</span> threshold, consider adjusting high wattage appliances during peak hours.
            </>
          ) : (
            <>
              You are maintaining a strong efficiency projection at <strong className="text-emerald-700 dark:text-emerald-400">{stats.dailyAverage.toFixed(2)} units</strong> consumed per day. This is well below the daily free credits allotment.
            </>
          )}
          {" "}
          At this rate, your projected 30-day bill period usage estimate will be <strong id="projected-metric" className="font-mono text-slate-800 dark:text-slate-200">{projectedUsage.toFixed(0)} kWh</strong>, saving approx {" "}
          <strong id="projected-savings-badge" className="text-emerald-700 dark:text-emerald-400 font-mono">{projectedSavings.toFixed(0)} kWh</strong> of free credit allowance.
        </p>
      </div>
    </div>
  );
}
