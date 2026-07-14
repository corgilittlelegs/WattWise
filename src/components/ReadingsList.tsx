import { BillDetails, MeterReading, calculateStats } from "../types";
import { Trash2, Calendar, Compass, FileText, CheckCircle2, AlertTriangle, Download, Printer } from "lucide-react";

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

  const downloadCSV = () => {
    const rows = [
      ["Date", "Meter Reading (kWh)", "Days Elapsed", "Units Consumed (kWh)", "Allowance Quota (kWh)", "Net Savings (kWh)", "Notes"]
    ];

    // Sorted chronological order (oldest first)
    const exportReadings = [...readings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    exportReadings.forEach((reading) => {
      const stats = calculateStats(bill, reading.reading, reading.date);
      rows.push([
        reading.date,
        reading.reading.toString(),
        stats.daysElapsed.toString(),
        stats.unitsConsumed.toString(),
        stats.freeAllowance.toString(),
        stats.unitsSaved.toString(),
        reading.notes || ""
      ]);
    });

    const csvContent = rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Wattwise_Readings_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-colors duration-150 shadow-xs">
      
      {/* List Header */}
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-extrabold uppercase tracking-wider text-xs text-neutral-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-neutral-500 dark:text-neutral-450" />
            Checkpoints Log History
          </h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5 font-mono">
            Your recorded physical meter readings and calculated balances
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {readings.length > 0 && (
            <>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#18181b] dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 border border-neutral-200 dark:border-neutral-800 font-bold text-[9px] uppercase tracking-widest rounded-lg cursor-pointer print:hidden transition-colors font-mono"
                title="Print Summary Report"
              >
                <Printer className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                <span>Print Report</span>
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-[9px] uppercase tracking-widest rounded-lg cursor-pointer print:hidden font-mono shadow-xs"
                title="Download readings as CSV"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </>
          )}
          <span className="text-[9px] bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 font-bold uppercase tracking-widest px-3 py-1.5 text-neutral-500 dark:text-neutral-400 rounded-lg print:hidden font-mono">
            {readings.length} logs
          </span>
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#121316]">
          <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 font-mono">No checkpoints recorded yet</p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-550 mt-1">
            Record a physical meter index above to build your timeline.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop/Tablet Table Layout */}
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="bg-neutral-50 dark:bg-[#0c0c0e] border-b border-neutral-200 dark:border-neutral-850 text-[9px] uppercase font-bold text-neutral-450 dark:text-neutral-500 tracking-widest font-mono">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Meter Reading</th>
                <th className="py-3.5 px-5">Elapsed</th>
                <th className="py-3.5 px-5">Cumulative Consumed</th>
                <th className="py-3.5 px-5">Saving Status</th>
                {onDelete && <th className="py-3.5 px-5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs bg-white dark:bg-[#121316] font-mono">
              {sortedReadings.map((reading) => {
                const stats = calculateStats(bill, reading.reading, reading.date);
                const isSaving = stats.unitsSaved >= 0;

                return (
                  <tr key={reading.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#18181b]/30 border-b border-neutral-100 dark:border-neutral-850 last:border-b-0 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-550" />
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
                            {new Date(reading.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {reading.notes && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block max-w-xs truncate italic mt-0.5">
                              &ldquo;{reading.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Meter Index */}
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">
                        {reading.reading.toLocaleString()}
                      </span>{" "}
                      <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-sans">kWh</span>
                    </td>

                    {/* Days Elapsed */}
                    <td className="py-3.5 px-5 font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-widest text-[9px]">
                      {stats.daysElapsed} days
                    </td>

                    {/* Consumed Units */}
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-neutral-800 dark:text-neutral-150">
                        {stats.unitsConsumed.toFixed(0)}
                      </span>{" "}
                      <span className="text-[10px] text-neutral-450 dark:text-neutral-550">kWh</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-0.5 font-sans">
                        Avg: <strong className="font-mono text-neutral-600 dark:text-neutral-400">{stats.dailyAverage.toFixed(1)}</strong> kWh/d
                      </span>
                    </td>

                    {/* Saving Target Check */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {isSaving ? (
                          <div className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>+{stats.unitsSaved.toFixed(1)} kWh</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/20 border border-rose-250/50 dark:border-rose-900/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>{stats.unitsSaved.toFixed(1)} kWh</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    {onDelete && (
                      <td className="py-3.5 px-5 text-right">
                        <button
                          id={`delete-reading-${reading.id}`}
                          onClick={() => onDelete(reading.id)}
                          className="p-1.5 text-neutral-450 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 rounded-lg inline-flex items-center justify-center cursor-pointer"
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
          <div className="block sm:hidden divide-y divide-neutral-150 dark:divide-neutral-800">
            {sortedReadings.map((reading) => {
              const stats = calculateStats(bill, reading.reading, reading.date);
              const isSaving = stats.unitsSaved >= 0;

              return (
                <div key={reading.id} className="p-4 space-y-3 bg-white dark:bg-[#121316] hover:bg-neutral-50/50 dark:hover:bg-[#18181b]/30 transition-colors">
                  <div className="flex justify-between items-start font-sans">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
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
                        className="p-1.5 text-neutral-450 dark:text-neutral-550 hover:text-rose-600 dark:hover:text-rose-450 border border-transparent hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:border-rose-100 dark:hover:border-rose-900/30 rounded-lg inline-flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-neutral-50 dark:bg-[#18181b] p-2 border border-neutral-200 dark:border-neutral-800 transition-colors rounded-lg">
                      <span className="text-[8px] text-neutral-450 dark:text-neutral-500 block uppercase font-bold tracking-wide">Reading</span>
                      <strong className="text-neutral-700 dark:text-neutral-300 text-xs">{reading.reading.toLocaleString()} kWh</strong>
                    </div>

                    <div className="bg-neutral-50 dark:bg-[#18181b] p-2 border border-neutral-200 dark:border-neutral-800 transition-colors rounded-lg">
                      <span className="text-[8px] text-neutral-450 dark:text-neutral-500 block uppercase font-bold tracking-wide">Days</span>
                      <strong className="text-neutral-700 dark:text-neutral-300 text-xs">{stats.daysElapsed} days</strong>
                    </div>

                    <div className="bg-neutral-50 dark:bg-[#18181b] p-2 border border-neutral-200 dark:border-neutral-800 transition-colors rounded-lg">
                      <span className="text-[8px] text-neutral-450 dark:text-neutral-500 block uppercase font-bold tracking-wide">Consumed</span>
                      <strong className="text-neutral-700 dark:text-neutral-300 text-xs">{stats.unitsConsumed.toFixed(0)} kWh</strong>
                    </div>

                    <div className={`p-2 border rounded-lg transition-colors ${
                      isSaving 
                        ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-900/40" 
                        : "bg-rose-50/20 dark:bg-rose-950/10 border-rose-250 dark:border-rose-900/40"
                    }`}>
                      <span className="text-[8px] text-neutral-450 dark:text-neutral-500 block uppercase font-bold tracking-wide">Balance</span>
                      <strong className={`text-xs ${isSaving ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isSaving ? "+" : ""}
                        {stats.unitsSaved.toFixed(1)} kWh
                      </strong>
                    </div>
                  </div>

                  {reading.notes && (
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 italic bg-neutral-50 dark:bg-[#18181b] p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
