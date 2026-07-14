/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  BillDetails, 
  MeterReading, 
  ArchivedCycle,
  INITIAL_BILL_DETAILS, 
  INITIAL_METER_READINGS 
} from "./types";
import Header from "./components/Header";
import BillConfig from "./components/BillConfig";
import AddReadingForm from "./components/AddReadingForm";
import CloudSync from "./components/CloudSync";
import CycleManager from "./components/CycleManager";
import InsightsDashboard from "./components/InsightsDashboard";
import SavingsChart from "./components/SavingsChart";
import ReadingsList from "./components/ReadingsList";
import { RotateCcw, AlertCircle, FileSpreadsheet, SunMedium } from "lucide-react";
import { subscribeToSyncSession, saveSyncSession } from "./lib/firebase";

export default function App() {
  // Load dark mode preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("wattwise_theme");
      if (saved) return saved === "dark";
      return false;
    } catch {
      return false;
    }
  });

  // Load from local storage or fall back to mock constants
  const [bill, setBill] = useState<BillDetails>(() => {
    try {
      const saved = localStorage.getItem("electricity_bill_anchor");
      return saved ? JSON.parse(saved) : INITIAL_BILL_DETAILS;
    } catch {
      return INITIAL_BILL_DETAILS;
    }
  });

  const [readings, setReadings] = useState<MeterReading[]>(() => {
    try {
      const saved = localStorage.getItem("electricity_meter_readings");
      return saved ? JSON.parse(saved) : INITIAL_METER_READINGS;
    } catch {
      return INITIAL_METER_READINGS;
    }
  });

  const [archivedCycles, setArchivedCycles] = useState<ArchivedCycle[]>(() => {
    try {
      const saved = localStorage.getItem("electricity_archived_cycles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCycleId, setSelectedCycleId] = useState<string>("active");

  // Theme observer
  useEffect(() => {
    try {
      localStorage.setItem("wattwise_theme", isDark ? "dark" : "light");
    } catch (e) {
      console.error("Local storage theme sync error:", e);
    }
  }, [isDark]);

  // System Date Indicator for UI
  const systemDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Cloud Sync state
  const [activeSyncKey, setActiveSyncKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem("wattwise_sync_key") || null;
    } catch {
      return null;
    }
  });

  // Ref to track last synchronized state to prevent loop-backs
  const lastSyncRef = useRef<{ bill: string; readings: string; archivedCycles: string } | null>(null);

  // Sync key listener & Firestore subscriber
  useEffect(() => {
    if (!activeSyncKey) {
      try {
        localStorage.removeItem("wattwise_sync_key");
      } catch {}
      return;
    }

    try {
      localStorage.setItem("wattwise_sync_key", activeSyncKey);
    } catch {}

    const unsubscribe = subscribeToSyncSession(activeSyncKey, (data) => {
      const billStr = JSON.stringify(data.bill);
      const readingsStr = JSON.stringify(data.readings);
      const archivedStr = JSON.stringify(data.archivedCycles || []);

      // Check if incoming cloud data is different from what we already have
      const currentBillStr = JSON.stringify(bill);
      const currentReadingsStr = JSON.stringify(readings);
      const currentArchivedStr = JSON.stringify(archivedCycles);

      if (billStr !== currentBillStr || readingsStr !== currentReadingsStr || archivedStr !== currentArchivedStr) {
        lastSyncRef.current = { bill: billStr, readings: readingsStr, archivedCycles: archivedStr };
        setBill(data.bill);
        setReadings(data.readings);
        setArchivedCycles(data.archivedCycles || []);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeSyncKey]);

  // Local changes uploader effect
  useEffect(() => {
    if (!activeSyncKey) return;

    const currentBillStr = JSON.stringify(bill);
    const currentReadingsStr = JSON.stringify(readings);
    const currentArchivedStr = JSON.stringify(archivedCycles);

    // If state is identical to our last sync snapshot, skip uploading
    if (lastSyncRef.current && 
        lastSyncRef.current.bill === currentBillStr && 
        lastSyncRef.current.readings === currentReadingsStr &&
        lastSyncRef.current.archivedCycles === currentArchivedStr) {
      return;
    }

    // This is a local change, upload it (debounced)
    lastSyncRef.current = { bill: currentBillStr, readings: currentReadingsStr, archivedCycles: currentArchivedStr };

    const uploadData = async () => {
      try {
        await saveSyncSession(activeSyncKey, bill, readings, archivedCycles);
      } catch (err) {
        console.error("Failed to upload local change to cloud sync:", err);
      }
    };

    const timeoutId = setTimeout(uploadData, 800);
    return () => clearTimeout(timeoutId);
  }, [bill, readings, archivedCycles, activeSyncKey]);

  // Persist state updates to localstorage
  useEffect(() => {
    try {
      localStorage.setItem("electricity_bill_anchor", JSON.stringify(bill));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [bill]);

  useEffect(() => {
    try {
      localStorage.setItem("electricity_meter_readings", JSON.stringify(readings));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [readings]);

  useEffect(() => {
    try {
      localStorage.setItem("electricity_archived_cycles", JSON.stringify(archivedCycles));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [archivedCycles]);

  // Handlers
  const handleUpdateBill = (updatedBill: BillDetails) => {
    setBill(updatedBill);
  };

  const handleAddReading = (newReading: Omit<MeterReading, "id">) => {
    const readingItem: MeterReading = {
      ...newReading,
      id: `reading-${Date.now()}`
    };
    setReadings(prev => [...prev, readingItem]);
  };

  const handleDeleteReading = (id: string) => {
    setReadings(prev => prev.filter(r => r.id !== id));
  };

  const handleSelectCycle = (id: string) => {
    setSelectedCycleId(id);
  };

  const handleArchiveCycle = (name: string, newStartDate: string, newStartReading: number) => {
    const newArchivedCycle: ArchivedCycle = {
      id: `cycle-${Date.now()}`,
      name,
      bill,
      readings,
      archivedAt: Date.now()
    };
    setArchivedCycles(prev => [newArchivedCycle, ...prev]);
    setBill({
      lastBillDate: newStartDate,
      lastBillReading: newStartReading
    });
    setReadings([]);
    setSelectedCycleId("active");
  };

  const handleDeleteArchive = (id: string) => {
    if (window.confirm("Are you sure you want to delete this archived cycle? All of its meter readings and historical data will be lost forever.")) {
      setArchivedCycles(prev => prev.filter(c => c.id !== id));
      setSelectedCycleId("active");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to revert all data back to the default demo values? Any local customizations and archived cycles will be lost.")) {
      setBill(INITIAL_BILL_DETAILS);
      setReadings(INITIAL_METER_READINGS);
      setArchivedCycles([]);
      setSelectedCycleId("active");
    }
  };

  const handleClearEverything = () => {
    if (window.confirm("Are you sure you want to clear ALL logged data points? This will empty out your checkpoints ledger.")) {
      setReadings([]);
    }
  };

  // Determine which bill details and readings to display based on active selection
  const isViewingActive = selectedCycleId === "active";
  const selectedArchivedCycle = !isViewingActive 
    ? archivedCycles.find(c => c.id === selectedCycleId) 
    : null;

  const currentBill = selectedArchivedCycle ? selectedArchivedCycle.bill : bill;
  const currentReadings = selectedArchivedCycle ? selectedArchivedCycle.readings : readings;

  return (
    <div className={`min-h-screen text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-805 transition-colors duration-150 ${
      isDark ? "dark bg-slate-950" : "bg-slate-50"
    }`}>
      {/* Visual top border */}
      <div className="h-1.5 w-full bg-indigo-600 dark:bg-indigo-500 shrink-0" />
      
      {/* Header Viewport */}
      <Header currentDateStr={systemDateStr} isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls column (Small left col on desktop, span 4) */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Cycle Manager */}
            <CycleManager 
              bill={bill}
              readings={readings}
              archivedCycles={archivedCycles}
              selectedCycleId={selectedCycleId}
              onSelectCycle={handleSelectCycle}
              onArchiveCycle={handleArchiveCycle}
              onDeleteArchive={handleDeleteArchive}
            />

            {/* Bill Anchor Config & Entry form (Only active cycle is editable) */}
            {isViewingActive ? (
              <>
                <BillConfig 
                  bill={bill} 
                  onChange={handleUpdateBill} 
                />

                <AddReadingForm 
                  bill={bill} 
                  readings={readings} 
                  onAdd={handleAddReading} 
                />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h4 className="font-display font-bold text-slate-450 dark:text-slate-550 text-[10px] uppercase tracking-widest">
                  Archived Configuration
                </h4>
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span>Cycle Start Date:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{new Date(currentBill.lastBillDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span>Start Meter Index:</span>
                    <strong className="text-slate-850 dark:text-slate-200 font-mono">{currentBill.lastBillReading.toLocaleString()} kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Recorded Logs:</span>
                    <strong className="text-slate-850 dark:text-slate-200">{currentReadings.length} checkpoints</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Cloud Sync Settings */}
            <CloudSync 
              bill={bill}
              readings={readings}
              archivedCycles={archivedCycles}
              activeSyncKey={activeSyncKey}
              onSyncStateLoaded={(loadedBill, loadedReadings, loadedArchived, syncKey) => {
                setBill(loadedBill);
                setReadings(loadedReadings);
                setArchivedCycles(loadedArchived);
                setActiveSyncKey(syncKey);
              }}
              onDisconnect={() => {
                setActiveSyncKey(null);
              }}
            />

            {/* Micro-insights and management action block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="font-display font-bold text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <SunMedium className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Quick Eco Tip
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                Gov free 10 units cover lighting, basic fans, and normal computer usage. Operating thermal loads like high-power kettles (1.5 kW), water heaters, or microwave ovens for just 1 hour uses up to 2-3 times your total eco-tier average!
              </p>
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 justify-between">
                <button
                  id="reset-demo-btn"
                  onClick={handleResetData}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Reset to default mock values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Demo</span>
                </button>
                
                {isViewingActive && readings.length > 0 && (
                  <button
                    id="clear-all-btn"
                    onClick={handleClearEverything}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-rose-505 dark:text-rose-450 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
            </div>

          </section>

          {/* Visualization & logs column (Large right col, span 8) */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Top Stats Dashboard Summary */}
            <InsightsDashboard 
              bill={currentBill} 
              readings={currentReadings} 
            />

            {/* Custom SVG trajectory chart */}
            <SavingsChart 
              bill={currentBill} 
              readings={currentReadings} 
              isDark={isDark}
            />

            {/* Physical Entries Log List */}
            <ReadingsList 
              bill={currentBill} 
              readings={currentReadings} 
              onDelete={isViewingActive ? handleDeleteReading : undefined} 
            />

          </section>
        </div>
      </main>

      {/* Subtle humble footer matching strict branding rules */}
      <footer className="py-8 mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400 dark:text-slate-500 select-none">
        <p className="text-xs font-medium uppercase tracking-wide">
          Daily Free Credit quota based on state general energy supply tariffs (10 units/day).
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
          All calculations are client-side only &bull; Data saved locally.
        </p>
      </footer>
    </div>
  );
}
