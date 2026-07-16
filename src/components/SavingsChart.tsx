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
    <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl relative transition-colors duration-150 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-extrabold uppercase tracking-wider text-xs text-neutral-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-550 dark:text-neutral-450" />
            Consumption Pathway vs. Quota Line
          </h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5 font-mono">
            Visualize cumulative meter usage relative to the 10 units/day free allowance cap
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-450 font-medium">
            <span className="w-3.5 h-0.5 border-t border-dashed border-neutral-400 dark:border-neutral-600 block shrink-0" />
            <span className="text-[9px] uppercase tracking-wider font-bold font-mono">Free Credits (10u/d)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-450 font-medium">
            <span className={`w-3.5 h-1 block shrink-0 ${isDark ? "bg-white" : "bg-neutral-900"}`} />
            <span className="text-[9px] uppercase tracking-wider font-bold font-mono">Meter Entry</span>
          </div>
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="h-[240px] border border-dashed border-neutral-200 dark:border-neutral-800 bg-[#f9fafb] dark:bg-[#18181b]/40 rounded-xl flex flex-col items-center justify-center text-center p-6 transition-colors duration-150">
          <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-700 mb-2 stroke-[1.5]" />
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-mono">No data points yet</p>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-1 max-w-[280px] font-sans">
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
              onClick={() => setHoveredPoint(null)}
            >
              {/* Horizontal grid lines */}
              {horizontalGridLines.map(val => (
                <g key={`y-grid-${val}`}>
                  <line 
                    x1={paddingLeft} 
                    y1={getY(val)} 
                    x2={width - paddingRight} 
                    y2={getY(val)} 
                    stroke={isDark ? "#222225" : "#e5e7eb"} 
                    strokeWidth="1"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={getY(val) + 3} 
                    textAnchor="end" 
                    className={`text-[9px] font-mono font-bold ${isDark ? "fill-neutral-500" : "fill-neutral-400"}`}
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
                      stroke={isDark ? "#222225" : "#e5e7eb"} 
                      strokeWidth="1"
                    />
                  )}
                  <text 
                    x={getX(d)} 
                    y={height - paddingBottom + 16} 
                    textAnchor="middle" 
                    className={`text-[9px] font-mono font-bold ${isDark ? "fill-neutral-500" : "fill-neutral-400"}`}
                  >
                    DAY {d}
                  </text>
                </g>
              ))}

              {/* Free allowance pathway dash line */}
              <circle cx={getX(0)} cy={getY(0)} r="2" fill={isDark ? "#71717a" : "#a1a1aa"} />
              <path 
                d={allowanceLinePath} 
                fill="none" 
                stroke={isDark ? "#71717a" : "#a1a1aa"} 
                strokeWidth="1.2" 
                strokeDasharray="4 4" 
                className="opacity-70"
              />

              {/* Actual consumption trajectory line */}
              <path 
                d={actualLinePath} 
                fill="none" 
                stroke={isDark ? "#ffffff" : "#09090b"} 
                strokeWidth="2" 
                strokeLinecap="square"
                strokeLinejoin="miter"
              />

              {/* Interactive datapoints on actual consumption */}
              {chartData.map((pt, i) => {
                const x = getX(pt.days);
                const y = getY(pt.consumed);
                const isHovered = hoveredPoint?.reading.id === (pt.isBaseline ? "base" : (readings.find(r => r.date === pt.date)?.id || ""));
                
                // Determine point indicator colors based on saving status
                const isSaving = (pt.days * 10) - pt.consumed >= 0;
                const pointColor = pt.isBaseline 
                  ? (isDark ? "#71717a" : "#a1a1aa") 
                  : isSaving ? "#10b981" : "#f43f5e";

                return (
                  <rect
                    key={`point-${i}`}
                    x={x - (isHovered ? 5 : 3)}
                    y={y - (isHovered ? 5 : 3)}
                    width={isHovered ? 10 : 6}
                    height={isHovered ? 10 : 6}
                    fill={isHovered ? (isDark ? "#0c0c0e" : "#ffffff") : pointColor}
                    stroke={isHovered ? (isDark ? "#ffffff" : "#09090b") : (isDark ? "#121316" : "#ffffff")}
                    strokeWidth={isHovered ? 2.5 : 1.2}
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
                    onClick={(e) => {
                      // Touch devices have no hover: tap toggles the tooltip instead.
                      e.stopPropagation();
                      if (pt.isBaseline) return;
                      const matchedReading = readings.find(r => r.date === pt.date);
                      if (!matchedReading) return;
                      setHoveredPoint(prev =>
                        prev?.reading.id === matchedReading.id
                          ? null
                          : {
                              x,
                              y,
                              reading: matchedReading,
                              days: pt.days,
                              consumed: pt.consumed,
                              allowance: pt.allowance,
                              saved: pt.allowance - pt.consumed
                            }
                      );
                    }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Interactive Absolute Tooltip Element */}
          {hoveredPoint && (
            <div 
              className="absolute z-30 bg-[#0c0c0e] text-white text-xs p-3.5 border border-neutral-800 shadow-2xl rounded-lg max-w-[220px] pointer-events-none transition-opacity duration-200 font-mono"
              style={{ 
                left: `${Math.min(width - 240, Math.max(20, hoveredPoint.x - 110))}px`, 
                top: `${Math.max(10, hoveredPoint.y - 120)}px` 
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5 mb-2">
                <span className="font-bold uppercase tracking-widest text-[9px] text-neutral-400">
                  Day {hoveredPoint.days} LOG
                </span>
                <span className="text-[9px] text-neutral-450 font-sans">
                  {new Date(hoveredPoint.reading.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="space-y-1 text-neutral-200">
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wide">Meter:</span>
                  <strong className="font-bold">{hoveredPoint.reading.reading.toLocaleString()} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wide">Consumed:</span>
                  <strong className="font-bold">{hoveredPoint.consumed.toFixed(1)} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wide">Limit:</span>
                  <strong className="font-bold text-neutral-400">{hoveredPoint.allowance.toFixed(0)} kWh</strong>
                </div>
                <div className="flex justify-between border-t border-neutral-850 mt-1.5 pt-1.5">
                  <span className="text-neutral-400 text-[9px] uppercase font-bold tracking-wide">Net Saved:</span>
                  <strong className={`font-bold ${hoveredPoint.saved >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                    {hoveredPoint.saved >= 0 ? "+" : ""}
                    {hoveredPoint.saved.toFixed(1)} kWh
                  </strong>
                </div>
              </div>
              {hoveredPoint.reading.notes && (
                <p className="text-[10px] text-neutral-400 italic mt-2 bg-[#121316] p-2 border border-neutral-800 rounded-sm font-sans">
                  &ldquo;{hoveredPoint.reading.notes}&rdquo;
                </p>
              )}
            </div>
          )}

          <div className="text-[9px] text-neutral-450 dark:text-neutral-500 mt-2 font-mono flex items-center justify-end gap-1 select-none uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hover individual points to inspect benchmarks</span>
          </div>
        </div>
      )}
    </div>
  );
}
