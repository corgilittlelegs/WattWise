import { useState, FormEvent } from "react";
import { Plus, Calendar, Compass, MessageSquare } from "lucide-react";
import { BillDetails, MeterReading } from "../types";

interface AddReadingFormProps {
  bill: BillDetails;
  readings: MeterReading[];
  onAdd: (reading: Omit<MeterReading, "id">) => void;
}

export default function AddReadingForm({ bill, readings, onAdd }: AddReadingFormProps) {
  // Default date representing "today" (based on current local system date)
  const defaultDate = (() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  })();
  const [date, setDate] = useState(defaultDate);
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-150">
      <h3 className="font-display font-bold uppercase tracking-wider text-xs text-indigo-600 dark:text-indigo-400 mb-1">
        New Reading Entry
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
        Enter the current digits shown on your physical meter box to analyze.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="reading-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={bill.lastBillDate}
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-505 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 font-sans transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-1.5">
              Meter value (kWh)
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="reading-kwh-input"
                type="number"
                step="any"
                value={readingStr}
                onChange={(e) => setReadingStr(e.target.value)}
                placeholder={`e.g. ${(latestLoggedReading + 15).toFixed(0)}`}
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-505 text-slate-800 dark:text-slate-100 font-mono bg-slate-50 dark:bg-slate-950 transition-colors"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block leading-none">
              Previous Entry: <strong className="font-mono text-slate-600 dark:text-slate-400">{latestLoggedReading.toLocaleString()}</strong> kWh
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-1.5">
            Quick Note / Context <span className="text-slate-350 dark:text-slate-500 font-normal capitalize">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <textarea
              id="reading-notes-input"
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Week after weather change, weekend trip..."
              className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-505 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 border border-rose-100 dark:border-rose-950/50 font-medium">
            {error}
          </p>
        )}

        <button
          id="submit-reading-btn"
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2.5 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/5"
        >
          <Plus className="w-4 h-4 text-white" />
          Record Entry
        </button>
      </form>
    </div>
  );
}
