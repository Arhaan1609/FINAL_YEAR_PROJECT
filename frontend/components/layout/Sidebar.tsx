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
  Activity,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    viewMode,
    vehicles,
    openBriefing,
    navigateToPage,
  } = useFleetStore();

  const totalCount = vehicles.length || 778;
  const readyCount =
    vehicles.length > 0
      ? vehicles.filter((v) => v.status === "active").length
      : 407;
  const warnCount =
    vehicles.length > 0
      ? vehicles.filter((v) => v.status === "warning").length
      : 346;
  const holdCount =
    vehicles.length > 0
      ? vehicles.filter((v) => v.status === "critical").length
      : 25;

  const navItems: {
    id: DashboardTab;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "fleet",
      label: "Fleet Health Twin",
      sub: "3D CAD & Cell Balances",
      icon: LayoutDashboard,
    },
    {
      id: "state-est",
      label: "State Estimation",
      sub: "SOC, SOH & RUL Models",
      icon: Cpu,
    },
    {
      id: "thermal",
      label: "Thermal Safety",
      sub: "Multi-Zone Temperatures",
      icon: Flame,
    },
    {
      id: "behavior",
      label: "Driver Behavior",
      sub: "Throttle & Energy Stress",
      icon: Gauge,
    },
    {
      id: "knee",
      label: "Knee Prognostics",
      sub: "Battery Aging Inflexion",
      icon: TrendingDown,
    },
    {
      id: "meta-ensemble",
      label: "Diagnostic Report",
      sub: "Asset Certification",
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] transition-colors select-none shrink-0 print:hidden font-sans">
      <div className="space-y-4">
        {/* Primary View: Operations Hub */}
        <div className="relative group">
          <button
            onClick={() => navigateToPage("operations")}
            className={`w-full flex items-center justify-between pr-8 pl-3.5 py-3 rounded-xl text-left transition-all border ${
              viewMode === "operations"
                ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-950 dark:text-cyan-100 font-bold shadow-xs"
                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  viewMode === "operations"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Operations Hub
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fleet Dispatch & Triage
                </div>
              </div>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBriefing("operations");
            }}
            title="Overview of Operations Hub"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Section Header: Analytical Workbenches */}
        <div>
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2">
            Engineering Workbenches
          </div>

          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                viewMode === "engineering" && activeTab === item.id;
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => navigateToPage(item.id)}
                    className={`w-full flex items-center justify-between pr-8 pl-3 py-2.5 rounded-xl text-left transition-all border ${
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold leading-tight truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
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
                    title={`Guide for ${item.label}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fleet Status Summary Card */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Fleet Status</span>
            </span>
            <span className="text-slate-500 text-xs font-mono">{totalCount} Total</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center py-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="p-1">
              <div className="text-emerald-600 dark:text-emerald-400 text-sm font-bold font-mono">
                {readyCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Ready</div>
            </div>
            <div className="p-1 border-x border-slate-100 dark:border-slate-800">
              <div className="text-amber-500 text-sm font-bold font-mono">
                {warnCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Review</div>
            </div>
            <div className="p-1">
              <div className="text-rose-500 text-sm font-bold font-mono">
                {holdCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Hold</div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex justify-between items-center">
              <span>Model Architecture</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">Euler HiLoad 12.4 kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Telemetry Sync</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Live (100ms)</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
