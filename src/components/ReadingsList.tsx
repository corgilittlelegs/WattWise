import { BillDetails, MeterReading, calculateStats } from "../types";
import { Trash2, Calendar, Compass, FileText, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";

interface ReadingsListProps {
  bill: BillDetails;
  readings: MeterReading[];
  onDelete?: (id: string) => void;
}

export default function ReadingsList({ bill, readings, onDelete }: ReadingsListProps) {
  // Sort readings in descending order (latest first) so the newest inputs stay on top!
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold uppercase tracking-wider text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Checkpoints Log History
          </h3>
          <p className="text-[11px] text-slate-405 dark:text-slate-450 mt-0.5">
            Your recorded physical meter readings and calculated balances
          </p>
        </div>
        <span className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider px-3 py-1 text-slate-600 dark:text-slate-400">
          {readings.length} Logged Entries
        </span>
      </div>

      {readings.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">No checkpoints recorded yet</p>
          <p className="text-[10px] text-slate-430 dark:text-slate-500 mt-1">
            Record a physical meter index above to build your timeline.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop/Tablet Table Layout */}
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-widest">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Meter Reading</th>
                <th className="py-3 px-5">Elapsed</th>
                <th className="py-3 px-5">Cumulative Consumed</th>
                <th className="py-3 px-5">Saving Status</th>
                {onDelete && <th className="py-3 px-5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs bg-white dark:bg-slate-900">
              {sortedReadings.map((reading) => {
                const stats = calculateStats(bill, reading.reading, reading.date);
                const isSaving = stats.unitsSaved >= 0;

                return (
                  <tr key={reading.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 last:border-b-0 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {new Date(reading.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {reading.notes && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block max-w-xs truncate italic">
                              &ldquo;{reading.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Meter Index */}
                    <td className="py-3.5 px-5 font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {reading.reading.toLocaleString()}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">kWh</span>
                    </td>

                    {/* Days Elapsed */}
                    <td className="py-3.5 px-5 font-medium text-slate-500 dark:text-slate-450 uppercase tracking-wide text-[10px]">
                      {stats.daysElapsed} days
                    </td>

                    {/* Consumed Units */}
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800 dark:text-slate-150 font-mono">
                        {stats.unitsConsumed.toFixed(0)}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400 dark:text-slate-505">kWh</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        Avg: <strong className="font-mono text-slate-600 dark:text-slate-400">{stats.dailyAverage.toFixed(1)}</strong> kWh/d
                      </span>
                    </td>

                    {/* Saving Target Check */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        {isSaving ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <span 
                            className={`font-bold font-mono ${
                              isSaving ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-455"
                            }`}
                          >
                            {isSaving ? "Saved " : "Exceeded "}
                            {isSaving ? "+" : ""}
                            {stats.unitsSaved.toFixed(1)} kWh
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-none">
                            Quota: {stats.freeAllowance.toFixed(0)} kWh
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    {onDelete && (
                      <td className="py-3.5 px-5 text-right font-sans">
                        <button
                          id={`delete-reading-${reading.id}`}
                          onClick={() => onDelete(reading.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-950 inline-flex items-center justify-center cursor-pointer"
                          title="Delete reading entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Layout (Strictly responsive stacked card structure) */}
          <div className="block sm:hidden divide-y divide-slate-150 dark:divide-slate-800">
            {sortedReadings.map((reading) => {
              const stats = calculateStats(bill, reading.reading, reading.date);
              const isSaving = stats.unitsSaved >= 0;

              return (
                <div key={reading.id} className="p-4 space-y-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(reading.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    {onDelete && (
                      <button
                        id={`delete-reading-mob-${reading.id}`}
                        onClick={() => onDelete(reading.id)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 border border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-100 dark:hover:border-rose-950 inline-flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 transition-colors">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Meter Reading</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono text-xs">{reading.reading.toLocaleString()} kWh</strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 transition-colors">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Elapsed Days</span>
                      <strong className="text-slate-700 dark:text-slate-300 text-xs">{stats.daysElapsed} days</strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 transition-colors">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Consumed</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono text-xs">{stats.unitsConsumed.toFixed(0)} kWh</strong>
                    </div>

                    <div className={`p-2 border transition-colors ${
                      isSaving ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/60" : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-250 dark:border-rose-900/60"
                    }`}>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Saving balance</span>
                      <strong className={`font-mono text-xs ${isSaving ? "text-emerald-700" : "text-rose-750"}`}>
                        {isSaving ? "+" : ""}
                        {stats.unitsSaved.toFixed(1)} kWh
                      </strong>
                    </div>
                  </div>

                  {reading.notes && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 italic bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-805">
                      &ldquo;{reading.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
