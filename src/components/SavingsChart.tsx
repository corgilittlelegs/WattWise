import { useState, useMemo } from "react";
import { BillDetails, MeterReading } from "../types";
import { Calendar, HelpCircle, Activity } from "lucide-react";

interface SavingsChartProps {
  bill: BillDetails;
  readings: MeterReading[];
  isDark?: boolean;
}

export default function SavingsChart({ bill, readings, isDark = false }: SavingsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    reading: MeterReading;
    days: number;
    consumed: number;
    allowance: number;
    saved: number;
  } | null>(null);

  // Parse and sort list of events
  const chartData = useMemo(() => {
    const [by, bm, bd] = bill.lastBillDate.split("-").map(Number);
    const baseTimeUTC = Date.UTC(by, bm - 1, bd);
    
    // Day 0: Baseline
    const points = [
      {
        days: 0,
        consumed: 0,
        allowance: 0,
        date: bill.lastBillDate,
        reading: bill.lastBillReading,
        isBaseline: true,
        notes: "Starting Invoice Anchor"
      }
    ];

    // Map each logged reading sorted of course
    const sorted = [...readings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach(r => {
      const [ry, rm, rd] = r.date.split("-").map(Number);
      const readingTimeUTC = Date.UTC(ry, rm - 1, rd);
      const diffTime = readingTimeUTC - baseTimeUTC;
      const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
      const consumed = Math.max(0, r.reading - bill.lastBillReading);
      const allowance = days * 10;

      points.push({
        days,
        consumed,
        allowance,
        date: r.date,
        reading: r.reading,
        isBaseline: false,
        notes: r.notes || ""
      });
    });

    return points;
  }, [bill, readings]);

  // Viewport setup
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find scale range
  const maxDays = useMemo(() => {
    const maxD = Math.max(...chartData.map(d => d.days));
    return Math.max(30, maxD + 5); // Pad some days for expansion look
  }, [chartData]);

  const maxUnits = useMemo(() => {
    const consumedMax = Math.max(...chartData.map(d => d.consumed));
    const allowanceMax = maxDays * 10;
    return Math.max(100, Math.ceil(Math.max(consumedMax, allowanceMax) * 1.15));
  }, [chartData, maxDays]);

  // Coordinate mappers
  const getX = (days: number) => paddingLeft + (days / maxDays) * chartWidth;
  const getY = (units: number) => paddingTop + chartHeight - (units / maxUnits) * chartHeight;

  // Build line paths
  const allowanceLinePath = useMemo(() => {
    const startX = getX(0);
    const startY = getY(0);
    const endX = getX(maxDays);
    const endY = getY(maxDays * 10);
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }, [maxDays, maxUnits]);

  const actualLinePath = useMemo(() => {
    if (chartData.length < 2) return "";
    return chartData.reduce((path, p, index) => {
      const x = getX(p.days);
      const y = getY(p.consumed);
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, "");
  }, [chartData, maxUnits, maxDays]);

  // Generate vertical grid lines
  const gridLines = useMemo(() => {
    const step = maxDays <= 35 ? 5 : maxDays <= 70 ? 10 : 20;
    const lines = [];
    for (let d = 0; d <= maxDays; d += step) {
      lines.push(d);
    }
    return lines;
  }, [maxDays]);

  // Generate horizontal grid lines
  const horizontalGridLines = useMemo(() => {
    const step = maxUnits <= 200 ? 50 : maxUnits <= 500 ? 100 : 200;
    const lines = [];
    for (let u = 0; u <= maxUnits; u += step) {
      lines.push(u);
    }
    return lines;
  }, [maxUnits]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 relative transition-colors duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold uppercase tracking-wider text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Consumption Pathway vs. Quota Line
          </h3>
          <p className="text-[11px] text-slate-405 dark:text-slate-400 mt-0.5">
            Visualize cumulative meter usage (indigo) relative to the 10 units/day free allowance cap (slate)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400 dark:border-slate-600 block shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Free Credits (10u/d)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-3.5 h-1 bg-indigo-600 dark:bg-indigo-500 block shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Meter Entry</span>
          </div>
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="h-[240px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center text-center p-6 transition-colors duration-150">
          <Calendar className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2 stroke-[1.5]" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">No data points yet</p>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-[280px]">
            Input your first meter reading to display the live timeline path.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* SVG Canvas wrapper */}
          <div className="overflow-x-auto select-none">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full min-w-[500px]"
              style={{ overflow: "visible" }}
            >
              {/* Horizontal grid lines */}
              {horizontalGridLines.map(val => (
                <g key={`y-grid-${val}`}>
                  <line 
                    x1={paddingLeft} 
                    y1={getY(val)} 
                    x2={width - paddingRight} 
                    y2={getY(val)} 
                    stroke={isDark ? "#1e293b" : "#f1f5f9"} 
                    strokeWidth="1"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={getY(val) + 3} 
                    textAnchor="end" 
                    className={`text-[9px] font-mono font-bold ${isDark ? "fill-slate-500" : "fill-slate-400"}`}
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* Vertical grid lines */}
              {gridLines.map(d => (
                <g key={`x-grid-${d}`}>
                  {d > 0 && d <= maxDays && (
                    <line 
                      x1={getX(d)} 
                      y1={paddingTop} 
                      x2={getX(d)} 
                      y2={height - paddingBottom} 
                      stroke={isDark ? "#1e293b" : "#f8fafc"} 
                      strokeWidth="1.5"
                    />
                  )}
                  <text 
                    x={getX(d)} 
                    y={height - paddingBottom + 16} 
                    textAnchor="middle" 
                    className={`text-[9px] font-mono font-bold ${isDark ? "fill-slate-500" : "fill-slate-400"}`}
                  >
                    DAY {d}
                  </text>
                </g>
              ))}

              {/* Free allowance pathway dash line */}
              <circle cx={getX(0)} cy={getY(0)} r="2" fill={isDark ? "#94a3b8" : "#64748b"} />
              <path 
                d={allowanceLinePath} 
                fill="none" 
                stroke={isDark ? "#94a3b8" : "#64748b"} 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                className="opacity-70"
              />

              {/* Actual consumption trajectory line */}
              <path 
                d={actualLinePath} 
                fill="none" 
                stroke={isDark ? "#818cf8" : "#4f46e5"} 
                strokeWidth="2.5" 
                strokeLinecap="square"
                strokeLinejoin="miter"
              />

              {/* Interactive interactive datapoints on actual consumption */}
              {chartData.map((pt, i) => {
                const x = getX(pt.days);
                const y = getY(pt.consumed);
                const isHovered = hoveredPoint?.reading.id === (pt.isBaseline ? "base" : (readings.find(r => r.date === pt.date)?.id || ""));
                
                // Determine point indicator colors based on saving status
                const isSaving = (pt.days * 10) - pt.consumed >= 0;
                const pointColor = pt.isBaseline 
                  ? (isDark ? "#94a3b8" : "#64748b") 
                  : isSaving ? "#10b981" : "#ef4444";

                return (
                  <rect
                    key={`point-${i}`}
                    x={x - (isHovered ? 5 : 3)}
                    y={y - (isHovered ? 5 : 3)}
                    width={isHovered ? 10 : 6}
                    height={isHovered ? 10 : 6}
                    fill={isHovered ? (isDark ? "#0f172a" : "#ffffff") : pointColor}
                    stroke={isHovered ? (isDark ? "#818cf8" : "#4f46e5") : (isDark ? "#0f172a" : "#ffffff")}
                    strokeWidth={isHovered ? 3 : 1.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => {
                      if (pt.isBaseline) return;
                      const matchedReading = readings.find(r => r.date === pt.date);
                      if (matchedReading) {
                        setHoveredPoint({
                          x,
                          y,
                          reading: matchedReading,
                          days: pt.days,
                          consumed: pt.consumed,
                          allowance: pt.allowance,
                          saved: pt.allowance - pt.consumed
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Interactive Absolute Tooltip Element */}
          {hoveredPoint && (
            <div 
              className="absolute z-30 bg-slate-900 dark:bg-slate-950 text-white text-xs p-3.5 border border-slate-800 dark:border-slate-800 shadow-xl max-w-[220px] pointer-events-none transition-opacity duration-200"
              style={{ 
                left: `${Math.min(width - 240, Math.max(20, hoveredPoint.x - 110))}px`, 
                top: `${Math.max(10, hoveredPoint.y - 120)}px` 
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300">
                  Day {hoveredPoint.days} LOG
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(hoveredPoint.reading.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="space-y-1 font-sans text-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Meter Index:</span>
                  <strong className="font-mono">{hoveredPoint.reading.reading.toLocaleString()} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 text-[10px] uppercase font-bold">Consumed:</span>
                  <strong className="font-mono">{hoveredPoint.consumed.toFixed(1)} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 text-[10px] uppercase font-bold">Daily Limit:</span>
                  <strong className="font-mono text-slate-400">{hoveredPoint.allowance.toFixed(0)} kWh</strong>
                </div>
                <div className="flex justify-between border-t border-slate-850 mt-1.5 pt-1.5">
                  <span className="text-indigo-455 dark:text-indigo-400 text-[10px] uppercase font-bold">Net Savings:</span>
                  <strong className={`font-mono ${hoveredPoint.saved >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                    {hoveredPoint.saved >= 0 ? "+" : ""}
                    {hoveredPoint.saved.toFixed(1)} kWh
                  </strong>
                </div>
              </div>
              {hoveredPoint.reading.notes && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2 bg-slate-950 p-2 border border-slate-800">
                  &ldquo;{hoveredPoint.reading.notes}&rdquo;
                </p>
              )}
            </div>
          )}

          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1.5 leading-relaxed flex items-center justify-end gap-1 select-none">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Hover individual points (square nodes) to inspect specific days' savings benchmarks.</span>
          </div>
        </div>
      )}
    </div>
  );
}
