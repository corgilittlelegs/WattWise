import { BillDetails } from "../types";
import { useState, FormEvent } from "react";
import { FileText, Calendar, Compass, Info, Check } from "lucide-react";

interface BillConfigProps {
  bill: BillDetails;
  onChange: (updatedBill: BillDetails) => void;
}

export default function BillConfig({ bill, onChange }: BillConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(bill.lastBillDate);
  const [tempReading, setTempReading] = useState(bill.lastBillReading.toString());
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedReading = parseFloat(tempReading);
    if (isNaN(parsedReading) || parsedReading < 0) {
      setError("Please key in a valid non-negative meter reading.");
      return;
    }

    if (!tempDate) {
      setError("Please select a valid bill issue date.");
      return;
    }

    onChange({
      lastBillDate: tempDate,
      lastBillReading: parsedReading,
    });
    setIsEditing(false);
  };

  return (
    <div className={`border transition-all duration-150 ${
      isEditing 
        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5" 
        : "bg-slate-900 dark:bg-slate-920 text-white border-slate-900 dark:border-slate-850 p-6"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-display font-bold uppercase tracking-wider text-xs flex items-center gap-2 ${
          isEditing ? "text-slate-800 dark:text-slate-200" : "text-slate-200"
        }`}>
          <FileText className="w-4 h-4 text-indigo-400" />
          Last Bill Reference
        </h3>
        {!isEditing && (
          <button
            id="edit-bill-btn"
            onClick={() => {
              setTempDate(bill.lastBillDate);
              setTempReading(bill.lastBillReading.toString());
              setIsEditing(true);
            }}
            className="text-[10px] uppercase tracking-widest font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1 transition-all cursor-pointer"
          >
            Edit Reference
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Bill Issue Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="edit-bill-date-input"
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-855 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-505 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Bill Meter Reading (kWh)
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="edit-bill-reading-input"
                type="number"
                step="any"
                value={tempReading}
                onChange={(e) => setTempReading(e.target.value)}
                placeholder="e.g. 4250"
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-855 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-505 text-slate-800 dark:text-slate-100 font-mono bg-slate-50 dark:bg-slate-950 transition-colors"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              id="save-bill-btn"
              type="submit"
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 py-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              id="cancel-bill-btn"
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              className="flex-1 bg-slate-150 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border border-transparent dark:border-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 block font-bold mb-1">
                Issue Date
              </span>
              <span className="text-lg font-medium text-white block">
                {new Date(bill.lastBillDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            
            <div className="h-px bg-slate-800 w-full"></div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 block font-bold mb-1">
                Meter Reading
              </span>
              <span className="text-2xl font-mono font-bold text-white block">
                {bill.lastBillReading.toLocaleString()} <span className="text-sm font-sans text-slate-400 font-normal">kWh</span>
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              All logged meter readings calculate elapsed duration and kWh consumption relative to this reference record.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
