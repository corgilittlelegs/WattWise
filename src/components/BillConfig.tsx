import { BillDetails } from "../types";
import { useState, FormEvent } from "react";
import { FileText, Compass, Info, Check } from "lucide-react";
import DatePicker from "./DatePicker";

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
    <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl transition-colors duration-150 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 text-neutral-900 dark:text-white">
          <FileText className="w-4 h-4 text-neutral-500 dark:text-neutral-450" />
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
            className="text-[9px] uppercase tracking-widest font-bold text-neutral-600 dark:text-neutral-350 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-805 border border-neutral-205 dark:border-neutral-800 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-mono"
          >
            Edit Reference
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 font-mono">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5">
              Bill Issue Date
            </label>
            <DatePicker
              id="edit-bill-date-input"
              value={tempDate}
              onChange={setTempDate}
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1.5">
              Bill Reading (kWh)
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-455 dark:text-neutral-555" />
              <input
                id="edit-bill-reading-input"
                type="number"
                step="any"
                value={tempReading}
                onChange={(e) => setTempReading(e.target.value)}
                placeholder="e.g. 4250"
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-neutral-205 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 border border-rose-105 dark:border-rose-900/50 rounded-lg">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              id="save-bill-btn"
              type="submit"
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
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
              className="flex-1 bg-neutral-50 dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 py-2.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 font-mono">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-550 block font-bold mb-1.5">
                Issue Date
              </span>
              <span className="text-base font-bold text-neutral-800 dark:text-white block font-sans">
                {new Date(bill.lastBillDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            
            <div className="h-px bg-neutral-100 dark:bg-neutral-850 w-full"></div>

            <div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-550 block font-bold mb-1.5">
                Meter Reading
              </span>
              <span className="text-2xl font-bold text-neutral-800 dark:text-white block">
                {bill.lastBillReading.toLocaleString()} <span className="text-xs font-sans text-neutral-450 dark:text-neutral-500 font-normal uppercase">kWh</span>
              </span>
            </div>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-850 w-full"></div>

          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 leading-snug flex items-start gap-1.5 font-sans">
            <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
            <span>
              All logged meter readings calculate elapsed duration and kWh consumption relative to this reference record.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
