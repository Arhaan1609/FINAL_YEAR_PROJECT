"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFleetStore } from "../../lib/store/useFleetStore";
import { Sparkles, Sun, Moon, ArrowLeft, Activity, Compass, Radio } from "lucide-react";
import { getVehicleTriage, triageLabel } from "../../lib/triage";

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    vehicles,
    selectedVehicleId,
    setSelectedVehicle,
    selectedLiveTriage,
    copilotOpen,
    setCopilotOpen,
    viewMode,
    activeTab,
    openBriefing,
    getFilteredVehicles,
    stateFilter,
    manufacturerFilter,
    statusFilter,
    searchQuery,
  } = useFleetStore();

  const [clockStr, setClockStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(now.toISOString().substring(11, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = getFilteredVehicles();
  const isFiltered =
    stateFilter !== "all" ||
    manufacturerFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim().length > 0;
  const displayVehicles =
    isFiltered && filteredVehicles.length > 0 ? filteredVehicles : vehicles;
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors print:hidden font-sans">
      {/* Left: Brand Identity & Navigation */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
          title="Return to Landing Page"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Landing</span>
        </Link>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            EV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                EV Battery Intelligence
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Fleet
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
              Multi-zone predictive diagnostics & state estimation
            </p>
          </div>
        </div>
      </div>

      {/* Center: Vehicle Chassis Selector */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-xs">
        <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Chassis:
        </span>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1 font-sans"
        >
          {displayVehicles.map((v) => {
            const isSelected = v.id === selectedVehicleId;
            const staticTriage = getVehicleTriage(v);
            const triage =
              isSelected && selectedLiveTriage ? selectedLiveTriage : staticTriage;
            return (
              <option
                key={v.id}
                value={v.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {v.id} · {v.model.split(" ")[0]} ({triageLabel(triage)})
              </option>
            );
          })}
        </select>
        {selectedLiveTriage &&
          selectedVehicle &&
          selectedLiveTriage !== getVehicleTriage(selectedVehicle) && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
              {triageLabel(selectedLiveTriage)}
            </span>
          )}
      </div>

      {/* Right: Telemetry Clock, Orientation Guide & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>{clockStr || "Syncing..."}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Page Guide Button */}
        <button
          onClick={() =>
            openBriefing(viewMode === "operations" ? "operations" : activeTab)
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs"
          title="Overview and explanation for this view"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Copilot button */}
        <button
          onClick={() => setCopilotOpen(!copilotOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
          <span>AI Copilot</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
