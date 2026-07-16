import { useState, FormEvent } from "react";
import { Plus, Compass, MessageSquare } from "lucide-react";
import { BillDetails, MeterReading } from "../types";
import { todayLocalISO } from "../lib/dates";
import DatePicker from "./DatePicker";

interface AddReadingFormProps {
  bill: BillDetails;
  readings: MeterReading[];
  onAdd: (reading: Omit<MeterReading, "id">) => void;
}

export default function AddReadingForm({ bill, readings, onAdd }: AddReadingFormProps) {
  const [date, setDate] = useState(todayLocalISO);
  const [readingStr, setReadingStr] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const readingVal = parseFloat(readingStr);
    if (isNaN(readingVal)) {
      setError("Please key in a valid numerical meter reading.");
      return;
    }

    if (readingVal < bill.lastBillReading) {
      setError(
        `Reading cannot be lower than the starting bill reading (${bill.lastBillReading.toLocaleString()} kWh).`
      );
      return;
    }

    const billDateTime = new Date(bill.lastBillDate).getTime();
    const inputDateTime = new Date(date).getTime();

    if (inputDateTime < billDateTime) {
      setError("Reading date cannot be prior to the previous bill issue date.");
      return;
    }

    // A meter can only go up. Compare against the highest reading logged on
    // or before this date so entries can't silently make usage go backwards.
    const priorOrSameDayReadings = readings.filter(
      (r) => new Date(r.date).getTime() <= inputDateTime
    );
    if (priorOrSameDayReadings.length > 0) {
      const maxPrior = Math.max(...priorOrSameDayReadings.map((r) => r.reading));
      if (readingVal < maxPrior) {
        setError(
          `Reading cannot be lower than a previously logged reading (${maxPrior.toLocaleString()} kWh) on or before this date.`
        );
        return;
      }
    }

    if (readings.some((r) => r.date === date)) {
      setError("A reading is already logged for this date. Edit or delete it first, or pick a different date.");
      return;
    }

    // Call callback
    onAdd({
      date,
      reading: readingVal,
      notes: notes.trim() || undefined,
    });

    // Reset fields, keep date as is for rapid log patterns
    setReadingStr("");
    setNotes("");
  };

  // Suggest reading based on latest logged reading to help user input
  const latestLoggedReading = readings.length > 0 
    ? Math.max(...readings.map(r => r.reading))
    : bill.lastBillReading;

  return (
    <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl transition-colors duration-150 shadow-xs">
      <h3 className="font-display font-extrabold uppercase tracking-wider text-xs text-neutral-900 dark:text-white mb-1">
        New Reading Entry
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-4">
        Enter the current digits shown on your physical meter box to analyze.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5 font-mono">
              Reading Date
            </label>
            <DatePicker
              id="reading-date-input"
              value={date}
              onChange={setDate}
              min={bill.lastBillDate}
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5 font-mono">
              Meter value (kWh)
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-550" />
              <input
                id="reading-kwh-input"
                type="number"
                step="any"
                value={readingStr}
                onChange={(e) => setReadingStr(e.target.value)}
                placeholder={`e.g. ${(latestLoggedReading + 15).toFixed(0)}`}
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 font-mono bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors"
                required
              />
            </div>
            <span className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-1 block leading-none font-mono">
              Previous: <strong className="font-bold text-neutral-700 dark:text-neutral-400">{latestLoggedReading.toLocaleString()}</strong> kWh
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5 font-mono">
            Quick Note / Context <span className="text-neutral-350 dark:text-neutral-500 font-normal capitalize">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400 dark:text-neutral-550" />
            <textarea
              id="reading-notes-input"
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Week after weather change..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors font-sans"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 border border-rose-100 dark:border-rose-900/50 font-medium rounded-lg">
            {error}
          </p>
        )}

        <button
          id="submit-reading-btn"
          type="submit"
          className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs font-mono"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Record Entry
        </button>
      </form>
    </div>
  );
}
