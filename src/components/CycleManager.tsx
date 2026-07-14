import React, { useState } from "react";
import { 
  FolderClosed, 
  FolderOpen,
  Plus, 
  Compass, 
  Archive, 
  ArrowRight, 
  Trash2, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";
import DatePicker from "./DatePicker";

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
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };
    const autoName = `${formatDate(bill.lastBillDate)} - ${formatDate(latestReadingDateStr)}`;
    setArchiveName(autoName);
    
    // Default new start date as day of latest reading
    setNewStartDate(latestReadingDateStr);
    
    // Default new reading as latest reading value
    setNewStartReading(latestReadingVal.toString());
    
    setFormError(null);
    setShowArchiveForm(true);
  };

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedReading = parseFloat(newStartReading);
    if (isNaN(parsedReading) || parsedReading < 0) {
      setFormError("Please enter a valid start meter reading.");
      return;
    }

    if (!archiveName.trim()) {
      setFormError("Please enter a name for the archive.");
      return;
    }

    onArchiveCycle(archiveName.trim(), newStartDate, parsedReading);
    setShowArchiveForm(false);
  };

  return (
    <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl transition-colors duration-150 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-extrabold uppercase tracking-wider text-xs text-neutral-900 dark:text-white flex items-center gap-2">
          <FolderClosed className="w-4 h-4 text-neutral-500 dark:text-neutral-405" />
          Billing Cycles
        </h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          title="Learn about cycles"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-[#18181b] p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-1.5 leading-relaxed">
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
          <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-550 mb-1.5 font-mono">
            Active view:
          </label>
          <select
            id="cycle-selector"
            value={selectedCycleId}
            onChange={(e) => onSelectCycle(e.target.value)}
            className="w-full text-xs font-bold py-2.5 px-3 border border-neutral-205 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-[#18181b] text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 font-mono shadow-xs cursor-pointer"
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
              className="w-full bg-neutral-50 hover:bg-neutral-100 dark:bg-[#18181b] dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 border border-neutral-200 dark:border-neutral-800 py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg shadow-xs font-mono"
            >
              <Archive className="w-3.5 h-3.5 text-neutral-500" />
              Archive & Start New Cycle
            </button>
          )
        ) : (
          /* Notice banner for read-only view */
          <div className="space-y-2 font-mono">
            <div className="p-3 bg-amber-50/10 dark:bg-amber-955/5 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 font-sans">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                Viewing Archived Cycle
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                You are viewing read-only historical metrics. Logging new reads or editing reference parameters is disabled.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                id="return-active-btn"
                onClick={() => onSelectCycle("active")}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2 px-3 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-lg text-center shadow-xs"
              >
                Return to Active
              </button>

              <button
                id="delete-archive-btn"
                onClick={() => onDeleteArchive(selectedCycleId)}
                className="bg-transparent hover:bg-rose-50/50 dark:hover:bg-rose-955/20 border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-rose-600 px-3 py-2 rounded-lg transition-colors cursor-pointer"
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
        <form onSubmit={handleConfirmArchive} className="mt-4 border-t border-neutral-150 dark:border-neutral-850 pt-4 space-y-4 font-mono">
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white">
            <Archive className="w-4 h-4" />
            <h4 className="text-xs font-display font-extrabold uppercase tracking-wider">
              Setup New Billing Cycle
            </h4>
          </div>

          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal font-sans">
            This will archive your current {readings.length} logs and start a fresh eco-allowance timeline.
          </p>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5">
              Label for Archived Cycle
            </label>
            <input
              id="archive-name-input"
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-neutral-205 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5">
                New Start Date
              </label>
            <DatePicker
              id="new-cycle-date-input"
              value={newStartDate}
              onChange={setNewStartDate}
            />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5">
                Start Reading (kWh)
              </label>
              <div className="relative">
                <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  id="new-cycle-reading-input"
                  type="number"
                  step="any"
                  value={newStartReading}
                  onChange={(e) => setNewStartReading(e.target.value)}
                  className="w-full text-[11px] pl-8 pr-2 py-2.5 border border-neutral-205 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50/50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 text-[10px] text-rose-600 dark:text-rose-405 flex items-start gap-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              id="confirm-archive-btn"
              type="submit"
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              Start Cycle
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="cancel-archive-btn"
              type="button"
              onClick={() => setShowArchiveForm(false)}
              className="flex-1 bg-neutral-50 dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-center rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
