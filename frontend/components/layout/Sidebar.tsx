"use client";

import React from "react";
import { useFleetStore, DashboardTab } from "../../lib/store/useFleetStore";
import {
  LayoutDashboard,
  Cpu,
  Flame,
  Gauge,
  TrendingDown,
  FileText,
  Briefcase,
  HelpCircle,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, viewMode, setViewMode, vehicles, openBriefing, navigateToPage } = useFleetStore();

  // Dynamically derived readiness metrics from store to stay in sync with live telemetry
  const totalCount = vehicles.length || 778;
  const readyCount = vehicles.length > 0 ? vehicles.filter((v) => v.status === "active").length : 407;
  const warnCount = vehicles.length > 0 ? vehicles.filter((v) => v.status === "warning").length : 346;
  const holdCount = vehicles.length > 0 ? vehicles.filter((v) => v.status === "critical").length : 25;

  const navItems: {
    id: DashboardTab;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "fleet",
      label: "Fleet Health Overview",
      sub: "3D Twin & KPIs",
      icon: LayoutDashboard,
    },
    {
      id: "state-est",
      label: "State Estimation Hub",
      sub: "Module A • 56 Models",
      icon: Cpu,
    },
    {
      id: "thermal",
      label: "Thermal Safety",
      sub: "Module B • Multi-Zone",
      icon: Flame,
    },
    {
      id: "behavior",
      label: "Driver Profiling",
      sub: "Module C • AI & BSI",
      icon: Gauge,
    },
    {
      id: "knee",
      label: "Knee Prognostics",
      sub: "Module C • Aging Curve",
      icon: TrendingDown,
    },
    {
      id: "meta-ensemble",
      label: "Meta-Ensemble Report",
      sub: "74-Model Audit",
      icon: FileText,
    },
  ];

  return (
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0D14] p-3.5 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-3.5rem)] transition-colors select-none shrink-0 print:hidden">
      <div className="space-y-1">
        {/* Operations Command Quick Switch with Orientation Guide */}
        <div className="relative group mb-2">
          <button
            onClick={() => navigateToPage("operations")}
            className={`w-full flex items-center justify-between pr-8 pl-3 py-2.5 rounded-xl text-left transition-all ${
              viewMode === "operations"
                ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-cyan-200 shrink-0" />
              <div>
                <div className="text-xs font-bold">Operations Hub</div>
                <div className="text-[10px] opacity-80">Non-EV Dispatch Triage</div>
              </div>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBriefing("operations");
            }}
            title="What does Operations Hub do? Click for guide"
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              viewMode === "operations"
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
          Diagnostic Modules (ML)
        </div>

        {navItems.map((item) => {
          const isActive = viewMode === "engineering" && activeTab === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => navigateToPage(item.id)}
                className={`w-full flex items-center justify-between pr-8 pl-3 py-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border-l-2 border-emerald-500 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs leading-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openBriefing(item.id);
                }}
                title={`What does ${item.label} do? Click for guide`}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-40 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── LIVE FLEET SENTINEL & TELEMETRY MINI-HUD ─── */}
      <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Fleet Sentinel</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">LIVE</span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center py-1 bg-white dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-800/60 text-[10px] font-mono font-bold">
            <div className="p-1">
              <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">{readyCount}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">Ready</div>
            </div>
            <div className="p-1 border-x border-slate-100 dark:border-slate-800/60">
              <div className="text-amber-500 text-xs font-bold font-mono">{warnCount}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">Warn</div>
            </div>
            <div className="p-1">
              <div className="text-rose-500 text-xs font-bold font-mono">{holdCount}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">Hold</div>
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">CAN Ingestion</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold">500 kbps (100ms)</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Neural Pipelines</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">74 ML Models</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Telemetry Sync</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold">{totalCount} Trucks SQL</span>
            </div>
          </div>
        </div>

        {/* Footer System Status */}
        <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/60 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Euler HiLoad 12.4 kWh</span>
          </div>
          <span className="text-[9px] text-slate-400">v2.4-PROD</span>
        </div>
      </div>
    </aside>
  );
};
