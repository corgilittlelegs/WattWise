import React, { useState } from "react";
import { 
  FolderClosed, 
  FolderOpen,
  Plus, 
  Calendar, 
  Compass, 
  Archive, 
  ArrowRight, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Info
} from "lucide-react";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";

interface CycleManagerProps {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles: ArchivedCycle[];
  selectedCycleId: string;
  onSelectCycle: (id: string) => void;
  onArchiveCycle: (name: string, newStartDate: string, newStartReading: number) => void;
  onDeleteArchive: (id: string) => void;
}

export default function CycleManager({
  bill,
  readings,
  archivedCycles,
  selectedCycleId,
  onSelectCycle,
  onArchiveCycle,
  onDeleteArchive
}: CycleManagerProps) {
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Form states
  const [archiveName, setArchiveName] = useState("");
  const [newStartDate, setNewStartDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  });
  const [newStartReading, setNewStartReading] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Derive default values for pre-population
  const latestReading = readings.length > 0 
    ? [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;
  const latestReadingDateStr = latestReading?.date || new Date().toISOString().split("T")[0];
  const latestReadingVal = latestReading?.reading ?? bill.lastBillReading;

  // Open form helper with defaults
  const handleOpenArchiveForm = () => {
    // Generate beautiful auto name e.g. "May 1 - Jul 9"
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const autoName = `Cycle: ${formatDate(bill.lastBillDate)} – ${formatDate(latestReadingDateStr)}`;
    
    setArchiveName(autoName);
    setNewStartDate(latestReadingDateStr);
    setNewStartReading(latestReadingVal.toString());
    setFormError(null);
    setShowArchiveForm(true);
  };

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedReading = parseFloat(newStartReading);
    if (isNaN(parsedReading) || parsedReading < 0) {
      setFormError("Starting meter reading must be a non-negative number.");
      return;
    }

    if (!newStartDate) {
      setFormError("Please select a starting date for the new cycle.");
      return;
    }

    if (new Date(newStartDate) < new Date(bill.lastBillDate)) {
      setFormError("The new cycle start date cannot be before the current cycle's issue date.");
      return;
    }

    onArchiveCycle(archiveName.trim(), newStartDate, parsedReading);
    setShowArchiveForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-150">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <FolderClosed className="w-4 h-4 text-indigo-500" />
          Billing Cycles
        </h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          title="Learn about cycles"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1.5 leading-relaxed">
          <p>
            <strong>Preserving History:</strong> Every 2 months or so, when a new utility bill arrives, you can archive your current cycle.
          </p>
          <p>
            This preserves all historical meter entries, calculations, and cost-benefit trajectories. Your charts, dashboards, and tables will instantly support choosing between any completed cycles and your active ledger!
          </p>
        </div>
      )}

      {/* Cycle Dropdown Selector */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-550 mb-1.5">
            Active view:
          </label>
          <select
            id="cycle-selector"
            value={selectedCycleId}
            onChange={(e) => onSelectCycle(e.target.value)}
            className="w-full text-xs font-medium py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="active">⚡ Active Cycle (Current Period)</option>
            {archivedCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                📂 {cycle.name} ({cycle.readings.length} logs)
              </option>
            ))}
          </select>
        </div>

        {selectedCycleId === "active" ? (
          /* Button to archive when in active mode */
          !showArchiveForm && (
            <button
              id="start-archive-btn"
              onClick={handleOpenArchiveForm}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 py-2 px-3 text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-500" />
              Archive & Start New Cycle
            </button>
          )
        ) : (
          /* Notice banner for read-only view */
          <div className="space-y-2">
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-450 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                Viewing Archived Cycle
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                You are viewing read-only historical metrics. Logging new reads or editing reference parameters is disabled.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                id="return-active-btn"
                onClick={() => onSelectCycle("active")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center"
              >
                Return to Active
              </button>

              <button
                id="delete-archive-btn"
                onClick={() => onDeleteArchive(selectedCycleId)}
                className="bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 px-3 py-1.5 transition-colors cursor-pointer"
                title="Delete this historical cycle forever"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cycle Archive Inline Form */}
      {showArchiveForm && (
        <form onSubmit={handleConfirmArchive} className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Archive className="w-4 h-4" />
            <h4 className="text-xs font-display font-bold uppercase tracking-wider">
              Setup New Billing Cycle
            </h4>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            This will archive your current {readings.length} logs and start a fresh eco-allowance timeline.
          </p>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Label for Archived Cycle
            </label>
            <input
              id="archive-name-input"
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                New Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="new-cycle-date-input"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Start Reading (kWh)
              </label>
              <div className="relative">
                <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="new-cycle-reading-input"
                  type="number"
                  step="any"
                  value={newStartReading}
                  onChange={(e) => setNewStartReading(e.target.value)}
                  className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-mono bg-slate-50 dark:bg-slate-950 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-[10px] text-rose-600 dark:text-rose-450 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              id="confirm-archive-btn"
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              Start Cycle
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="cancel-archive-btn"
              type="button"
              onClick={() => setShowArchiveForm(false)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
