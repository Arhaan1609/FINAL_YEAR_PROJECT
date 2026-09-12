"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFleetStore, DashboardTab, ViewMode } from "../../lib/store/useFleetStore";
import { OperationsView } from "../../components/dashboard/OperationsView";
import { FleetOverviewTab } from "../../components/tabs/FleetOverviewTab";
import { StateEstimationTab } from "../../components/tabs/StateEstimationTab";
import { ThermalSafetyTab } from "../../components/tabs/ThermalSafetyTab";
import { DriverProfilingTab } from "../../components/tabs/DriverProfilingTab";
import { KneePrognosticsTab } from "../../components/tabs/KneePrognosticsTab";
import { MetaEnsembleReportTab } from "../../components/tabs/MetaEnsembleReportTab";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Cpu,
  Flame,
  Gauge,
  TrendingDown,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  Compass,
} from "lucide-react";

/**
 * Syncs the Zustand store with URL parameters (?tab=..., ?view=..., ?vehicle=...)
 * Enables deep linking, bookmarking, and native browser Back/Forward navigation.
 */
function DashboardUrlSync() {
  const searchParams = useSearchParams();
  const isInitialized = React.useRef(false);
  const {
    activeTab,
    viewMode,
    selectedVehicleId,
    setActiveTab,
    setViewMode,
    setSelectedVehicle,
  } = useFleetStore();

  // 1. Sync from URL on Mount or when URL changes (direct link, browser back/forward)
  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get("tab") as DashboardTab | null;
    const viewParam = searchParams.get("view") as ViewMode | null;
    const vehicleParam = searchParams.get("vehicle");

    const validTabs: DashboardTab[] = [
      "fleet",
      "state-est",
      "thermal",
      "behavior",
      "knee",
      "meta-ensemble",
    ];

    if (viewParam === "operations") {
      setViewMode("operations");
    } else if (viewParam === "engineering" || (tabParam && validTabs.includes(tabParam))) {
      setViewMode("engineering");
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (vehicleParam && vehicleParam.trim()) {
      setSelectedVehicle(vehicleParam.trim());
    }

    // Mark as initialized so store-to-URL sync only runs on deliberate user interaction
    isInitialized.current = true;
  }, [searchParams, setActiveTab, setViewMode, setSelectedVehicle]);

  // 2. Keep browser URL in sync when user deliberately changes tab, view, or vehicle in the UI
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized.current) return;
    const url = new URL(window.location.href);
    let changed = false;

    if (viewMode === "operations") {
      if (url.searchParams.get("view") !== "operations") {
        url.searchParams.set("view", "operations");
        url.searchParams.delete("tab");
        changed = true;
      }
    } else {
      if (url.searchParams.get("view") === "operations") {
        url.searchParams.delete("view");
        changed = true;
      }
      if (url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("tab", activeTab);
        changed = true;
      }
    }

    if (selectedVehicleId && url.searchParams.get("vehicle") !== selectedVehicleId) {
      url.searchParams.set("vehicle", selectedVehicleId);
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, [viewMode, activeTab, selectedVehicleId]);

  return null;
}

export default function DashboardPage() {
  const { activeTab, setActiveTab, viewMode, setViewMode, openBriefing, navigateToPage } = useFleetStore();

  const mobileTabs = [
    { id: "fleet", label: "Fleet Hub", icon: LayoutDashboard },
    { id: "state-est", label: "Module A: State", icon: Cpu },
    { id: "thermal", label: "Module B: Thermal", icon: Flame },
    { id: "behavior", label: "Module C: Driver", icon: Gauge },
    { id: "knee", label: "Module C: Knee", icon: TrendingDown },
    { id: "meta-ensemble", label: "Meta Ensemble", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* ─── URL SEARCH PARAMS & ROUTE DEEP-LINK SYNCHRONIZER ─── */}
      <Suspense fallback={null}>
        <DashboardUrlSync />
      </Suspense>

      {/* ─── DASHBOARD MODE SWITCHER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden font-sans">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold shadow-xs">
            {viewMode === "operations" ? <Briefcase className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {viewMode === "operations" ? "Fleet Operations & Dispatch" : "Engineering Telemetry Workbench"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {viewMode === "operations" ? "Commercial Dispatch" : "74 ML Models"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {viewMode === "operations"
                ? "Real-time dispatch readiness, route clearance, and battery health verification."
                : "Multi-parameter state estimation, thermal safety envelopes, and battery degradation prognostics."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Guide Trigger */}
          <button
            onClick={() => openBriefing(viewMode === "operations" ? "operations" : activeTab)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs"
            title="Open guide explaining this view"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Guide</span>
          </button>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => navigateToPage("operations")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === "operations"
                  ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Operations</span>
            </button>

            <button
              onClick={() => navigateToPage(activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === "engineering"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Engineering</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── RENDER CONTENT ACCORDING TO VIEW MODE ─── */}
      {viewMode === "operations" ? (
        <OperationsView />
      ) : (
        <div className="space-y-6">
          {/* Engineering Tab Scroller for Mobile */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 print:hidden">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateToPage(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800"
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Tab Render with Page Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "fleet" && <FleetOverviewTab />}
              {activeTab === "state-est" && <StateEstimationTab />}
              {activeTab === "thermal" && <ThermalSafetyTab />}
              {activeTab === "behavior" && <DriverProfilingTab />}
              {activeTab === "knee" && <KneePrognosticsTab />}
              {activeTab === "meta-ensemble" && <MetaEnsembleReportTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
