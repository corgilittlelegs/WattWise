import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  id?: string;
  value: string; // format "YYYY-MM-DD"
  onChange: (value: string) => void;
  min?: string; // format "YYYY-MM-DD"
  max?: string; // format "YYYY-MM-DD"
  className?: string;
}

export default function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD string into a local Date object
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Convert Date object to YYYY-MM-DD string in local timezone
  const toDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const selectedDate = parseDateString(value);
  const [viewDate, setViewDate] = useState(selectedDate);

  // Sync internal view state when value changes externally
  useEffect(() => {
    setViewDate(parseDateString(value));
  }, [value]);

  // Click outside to close helper
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (date: Date) => {
    const dateStr = toDateString(date);
    // Check min/max constraints
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

    // Pad previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      const prevDateStr = toDateString(prevDate);
      const isDisabled = !!((min && prevDateStr < min) || (max && prevDateStr > max));
      cells.push({ date: prevDate, isCurrentMonth: false, isDisabled });
    }

    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      const currentDate = new Date(year, month, i);
      const currentDateStr = toDateString(currentDate);
      const isDisabled = !!((min && currentDateStr < min) || (max && currentDateStr > max));
      cells.push({ date: currentDate, isCurrentMonth: true, isDisabled });
    }

    // Pad next month days to make it exactly 6 rows (42 cells) to avoid height jumping
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const nextDateStr = toDateString(nextDate);
      const isDisabled = !!((min && nextDateStr < min) || (max && nextDateStr > max));
      cells.push({ date: nextDate, isCurrentMonth: false, isDisabled });
    }

    return cells;
  }, [viewDate, min, max]);

  // Readable label for trigger field (e.g. "July 14, 2026")
  const displayLabel = value
    ? parseDateString(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger element (Looks like input) */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 text-xs pl-3 pr-3 py-2.5 border border-neutral-205 dark:border-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-[#18181b] rounded-lg transition-colors cursor-pointer text-left font-mono ${className}`}
      >
        <CalendarIcon className="w-4 h-4 text-neutral-450 dark:text-neutral-550 shrink-0" />
        <span className="truncate">{displayLabel}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 p-3.5 bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-64 select-none animate-in fade-in slide-in-from-top-1 duration-100 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 rounded-md transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 dark:text-white font-mono">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 rounded-md transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 gap-1 font-mono text-[10px]">
            {calendarCells.map((cell, idx) => {
              const cellStr = toDateString(cell.date);
              const isSelected = cellStr === value;
              const isToday = toDateString(new Date()) === cellStr;

              return (
                <button
                  key={`${cellStr}-${idx}`}
                  type="button"
                  onClick={() => !cell.isDisabled && handleSelectDay(cell.date)}
                  disabled={cell.isDisabled}
                  className={`py-1.5 text-center rounded-md font-bold transition-all relative ${
                    cell.isDisabled
                      ? "text-neutral-250 dark:text-neutral-750 opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs cursor-pointer"
                      : isToday
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                      : cell.isCurrentMonth
                      ? "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-805 cursor-pointer"
                      : "text-neutral-400 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-805 cursor-pointer"
                  }`}
                >
                  <span>{cell.date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
