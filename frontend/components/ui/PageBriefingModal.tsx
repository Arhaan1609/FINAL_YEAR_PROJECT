"use client";

import React, { useEffect } from "react";
import { useFleetStore, DashboardTab } from "../../lib/store/useFleetStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  LayoutDashboard,
  Cpu,
  Flame,
  Gauge,
  TrendingDown,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  BookOpen,
  Lightbulb,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export interface BriefingModuleContent {
  id: string;
  tabKey?: DashboardTab;
  title: string;
  subtitle: string;
  badge: string;
  roleBadge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: "cyan" | "emerald" | "amber" | "purple" | "rose" | "blue";
  summary: string;
  whatItDoes: string[];
  inferences: {
    level: "nominal" | "warning" | "critical";
    indicator: string;
    meaning: string;
    action: string;
  }[];
  glossary: {
    term: string;
    definition: string;
  }[];
  proTip: string;
}

export const PAGE_BRIEFINGS: Record<string, BriefingModuleContent> = {
  operations: {
    id: "operations",
    title: "Operations Command & Dispatch Triage",
    subtitle: "Frontline delivery route readiness and vehicle safety triage",
    badge: "Operations Command",
    roleBadge: "For: Shift Supervisors, Route Dispatchers & Warehouse Leads",
    icon: Briefcase,
    accentColor: "emerald",
    summary:
      "This is your daily command center for electric commercial fleets. Instead of looking at complex chemistry charts or raw battery voltages, this page translates multi-sensor battery intelligence into a simple traffic-light dispatch system. It immediately answers the single most important question of your shift: 'Can I safely hand the keys to a driver and dispatch this truck on today's delivery route?'",
    whatItDoes: [
      "Categorizes every commercial EV into Active (Ready to Go), Warning (Top-Up First), or Critical (Ground Truck).",
      "Calculates realistic driving range (km) based on real-world Indian road, traffic, and payload conditions.",
      "Shows instant depot-level summaries of which trucks are available right now for immediate delivery dispatch.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "Green / Active (Ready for Route)",
        meaning:
          "Battery charge is above 20%, temperature is normal (<40°C), and pack health is strong with zero safety anomalies.",
        action: "Assign driver immediately and dispatch on regular scheduled delivery routes.",
      },
      {
        level: "warning",
        indicator: "Amber / Warning (Needs Charge or Cool-Down)",
        meaning:
          "Battery charge is low (<20% SOC) or pack temperature is moderately elevated from previous highway driving.",
        action:
          "Route truck to a 30-minute fast charger or allow a 20-minute shaded cool-down before assigning long-haul trips.",
      },
      {
        level: "critical",
        indicator: "Red / Critical (Lockout & Ground Vehicle)",
        meaning:
          "High thermal risk, rapid cell imbalance, or abnormal voltage sag detected by our live Machine Learning sentinel.",
        action:
          "DO NOT DISPATCH. Ground vehicle immediately, place physical lockout tag on steering wheel, and notify maintenance bay.",
      },
    ],
    glossary: [
      {
        term: "SOC (State of Charge)",
        definition: "The battery's fuel gauge (percentage of usable energy left, 0% to 100%).",
      },
      {
        term: "SOH (State of Health)",
        definition: "Long-term battery pack lifespan (100% = brand new, <80% = aging battery nearing retirement).",
      },
      {
        term: "Dispatch Triage",
        definition: "Instant 3-way sorting of vehicles so operations teams know what to drive and what to hold back.",
      },
    ],
    proTip:
      "Start every morning shift on this page. If any vehicle is under 'Critical Hold', check its license plate and alert the charging depot supervisor before drivers arrive.",
  },

  fleet: {
    id: "fleet",
    tabKey: "fleet",
    title: "Fleet Health Overview & 3D Digital Twin",
    subtitle: "3D virtual truck visualization and live CAN bus telemetry streaming",
    badge: "Module A • Fleet Twin",
    roleBadge: "For: Depot Coordinators, Operations Engineers & Fleet Managers",
    icon: LayoutDashboard,
    accentColor: "cyan",
    summary:
      "Provides an interactive 3D digital model of an electric delivery truck (Euler HiLoad LFP architecture) side-by-side with live sensor telemetry from the vehicle's internal computer (CAN bus). You can inspect any of the 778 commercial trucks in the fleet registry with a single click.",
    whatItDoes: [
      "Visualizes live heat distribution across the 3D vehicle chassis and battery pack enclosure in real time.",
      "Displays an oscilloscope showing live 500 kbps telemetry packet streaming (voltage, current, temperature, speed).",
      "Features a searchable, filterable registry of all 778 vehicles across Delhi, Mumbai, and Bengaluru hubs.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "Cyan / Blue 3D Chassis Glow",
        meaning: "Thermal dissipation across the battery pack is smooth and uniform; cooling systems are functioning normally.",
        action: "Normal monitoring. No maintenance required.",
      },
      {
        level: "warning",
        indicator: "Fluctuating CAN Bus Oscilloscope",
        meaning: "Intermittent telematics packet loss or high latency from vehicle cellular modem.",
        action: "Check vehicle IoT gateway antenna connections during evening depot check-in.",
      },
      {
        level: "critical",
        indicator: "Red Plate in Registry Table",
        meaning: "Vehicle has recorded an active critical safety alert or abnormal battery voltage sag.",
        action: "Click the vehicle plate to inspect its telemetry and issue a maintenance inspection order.",
      },
    ],
    glossary: [
      {
        term: "3D Digital Twin",
        definition: "A live virtual replica of the physical truck that mirrors its temperature and electrical conditions.",
      },
      {
        term: "CAN Bus",
        definition: "The internal wiring network inside the truck that transmits sensor data from the battery to the cloud.",
      },
      {
        term: "Telemetry",
        definition: "Automated real-time measurements transmitted wirelessly from vehicles on the road to this dashboard.",
      },
    ],
    proTip:
      "Click any truck plate in the registry table (e.g. DL1LAK7203). The entire dashboard instantly switches context to diagnose that specific vehicle!",
  },

  "state-est": {
    id: "state-est",
    tabKey: "state-est",
    title: "State Estimation Hub — Module A",
    subtitle: "56 Machine Learning models calculating true battery charge, health & remaining lifespan",
    badge: "Module A • 56 Models",
    roleBadge: "For: Battery Calibration Engineers & Fleet Reliability Analysts",
    icon: Cpu,
    accentColor: "purple",
    summary:
      "Standard vehicle dashboard meters drift over time due to weather swings, aging, and heavy commercial workloads — causing 'phantom range' where a driver thinks they have 30% battery, but the truck suddenly shuts down. Module A runs 56 Machine Learning algorithms (ExtraTrees, XGBoost, CatBoost, LightGBM, Random Forest) to calculate the true chemical battery state with laboratory precision.",
    whatItDoes: [
      "Calculates True State of Charge (SOC) with ±0.7% accuracy, eliminating phantom range anxiety.",
      "Calculates State of Health (SOH) and predicts Remaining Useful Life (RUL) in full operational charge cycles.",
      "Performs real-time feature importance analysis to show whether voltage, current, or heat is driving degradation.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "SOH > 85% & True SOC Matches Meter",
        meaning: "Battery cells are chemically balanced and retaining maximum charge capacity.",
        action: "Vehicle is cleared for maximum payload routes (up to 688 kg rated cargo).",
      },
      {
        level: "warning",
        indicator: "SOH 80% – 85% (Approaching Retirement)",
        meaning: "Battery pack is experiencing normal commercial aging. Range per charge is reduced by ~15%.",
        action: "Restrict vehicle to shorter intra-city delivery loops rather than regional highway trips.",
      },
      {
        level: "critical",
        indicator: "SOH < 80% or Severe Coulombic Inefficiency",
        meaning: "Battery has reached its end-of-primary-life threshold. High internal resistance detected.",
        action: "Schedule vehicle for cell rebalancing or battery pack replacement under fleet warranty.",
      },
    ],
    glossary: [
      {
        term: "SOC (State of Charge)",
        definition: "True usable energy percentage remaining in the lithium-iron-phosphate (LFP) battery.",
      },
      {
        term: "SOH (State of Health)",
        definition: "The battery's maximum energy storage capacity compared to when it rolled off the factory floor.",
      },
      {
        term: "RUL (Remaining Useful Life)",
        definition: "The estimated number of full charge-discharge cycles the pack can sustain before failure.",
      },
    ],
    proTip:
      "Compare the 'Reported BMS SOC' with the 'AI Estimated SOC'. If there is a gap greater than 5%, the hardware sensor needs manual zero-calibration.",
  },

  thermal: {
    id: "thermal",
    tabKey: "thermal",
    title: "Multi-Zone Thermal Safety — Module B",
    subtitle: "200-Tree Random Forest classifier stopping thermal runaway before it starts",
    badge: "Module B • Multi-Zone Safety",
    roleBadge: "For: Safety Officers, Depot Technicians & Emergency Responders",
    icon: Flame,
    accentColor: "amber",
    summary:
      "Electric commercial trucks generate intense heat when hauling heavy cargo in hot climates. Module B continuously monitors 3 independent thermal zones: the Battery Pack Core, the Inverter Motor Controller, and the Powertrain Motor. An ensemble of 200 decision trees detects abnormal heat buildup and shuts down thermal hazards before dangerous temperatures can be reached.",
    whatItDoes: [
      "Monitors real-time temperatures across 3 physical heat zones simultaneously.",
      "Calculates thermal differentials (ΔT) between the battery core and exterior cooling systems.",
      "Delivers 99.7% F1 score detection accuracy for early pre-runaway thermal anomalies.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "All 3 Zones < 42°C (Thermal Equilibrium)",
        meaning: "Heat generated by driving is being actively rejected by the cooling circuit.",
        action: "Normal vehicle operation approved.",
      },
      {
        level: "warning",
        indicator: "Battery Core 45°C – 50°C (Thermal Advisory)",
        meaning: "Heavy heat accumulation from aggressive driving or high ambient temperatures.",
        action: "Recommend driver park in the shade and allow 20 minutes before plugging into a high-rate DC fast charger.",
      },
      {
        level: "critical",
        indicator: "Zone Temp > 50°C or Rapid ΔT Spike",
        meaning: "Thermal runaway hazard! Heat is multiplying faster than the cooling loop can dissipate it.",
        action: "EMERGENCY PROTOCOL: Stop vehicle, disengage high-voltage contactor, and isolate truck from flammable surroundings.",
      },
    ],
    glossary: [
      {
        term: "Thermal Runaway",
        definition: "A hazardous chain reaction where an overheated battery cell triggers neighboring cells. Our AI detects this early.",
      },
      {
        term: "Multi-Zone Thermal",
        definition: "Tracking heat separately in the battery, the inverter, and the motor to pinpoint exact hot spots.",
      },
      {
        term: "ΔT (Delta Temperature)",
        definition: "The temperature difference between two zones (e.g. core vs cooling surface).",
      },
    ],
    proTip:
      "Fast charging a battery while its core temperature is above 45°C causes rapid cell degradation. Always verify thermal health before plugging into a DC fast charger!",
  },

  behavior: {
    id: "behavior",
    tabKey: "behavior",
    title: "Driver Behavioral Profiling — Module C",
    subtitle: "AI analysis of acceleration, braking, and electrochemical battery stress",
    badge: "Module C • Driver AI",
    roleBadge: "For: Driver Trainers, Safety Managers & Depot Fleet Leads",
    icon: Gauge,
    accentColor: "emerald",
    summary:
      "A driver's habits directly determine how long an EV battery lasts. Stomping on the accelerator forces massive electrical current spikes (Joule heating), while harsh braking wastes valuable regenerative energy. This module computes a Battery Stress Index (BSI) from 0.0 (perfect eco-driver) to 1.0 (severe electrochemical abuse) to coach drivers toward battery-preserving habits.",
    whatItDoes: [
      "Analyzes CAN bus throttle and brake telemetry to count harsh accelerations and emergency stops.",
      "Calculates the Battery Stress Index (BSI) and assigns an Eco-Driving Grade (A to F).",
      "Estimates battery lifespan extension achieved through smooth regenerative braking.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "Grade A / Eco-Pro Driver (BSI < 0.35)",
        meaning: "Smooth, progressive throttle application and high regenerative braking recovery.",
        action: "Reward driver! This driving style extends the vehicle's battery pack lifespan by up to 2 full years.",
      },
      {
        level: "warning",
        indicator: "Grade C / Moderate Stress (BSI 0.35 – 0.65)",
        meaning: "Occasional hard accelerations or highway speed surges causing minor thermal spikes.",
        action: "Provide driver with eco-driving tips on maintaining steady cruising speeds.",
      },
      {
        level: "critical",
        indicator: "Grade D/F / High Abuse (BSI > 0.65)",
        meaning: "Frequent pedal stomps and sudden braking cause severe Joule heating and rapid capacity fade.",
        action: "Schedule driver for mandatory EV regenerative braking coaching before next route dispatch.",
      },
    ],
    glossary: [
      {
        term: "BSI (Battery Stress Index)",
        definition: "A composite AI score from 0.0 (gentle) to 1.0 (abusive) measuring wear and tear on the battery.",
      },
      {
        term: "Regenerative Braking",
        definition: "Reversing the electric motor to slow down the truck, sending free energy back into the battery.",
      },
      {
        term: "Joule Heating (I²R)",
        definition: "Intense heat produced inside battery cells during sudden, violent acceleration surges.",
      },
    ],
    proTip:
      "Drivers who use regenerative braking effectively increase single-charge driving range by 15% to 22% during city stop-and-go delivery routes!",
  },

  knee: {
    id: "knee",
    tabKey: "knee",
    title: "Knee-Point Degradation Prognostics — Module C",
    subtitle: "Forecasting the sudden non-linear inflection cliff in commercial battery aging",
    badge: "Module C • Aging Prognostics",
    roleBadge: "For: Asset Managers, Financial Controllers & Warranty Planners",
    icon: TrendingDown,
    accentColor: "rose",
    summary:
      "Lithium-ion batteries do NOT age in a smooth, straight line. For hundreds of delivery cycles, the battery degrades very slowly (about 1% per year), and then suddenly hits an inflection point known as the 'Knee Point'. Past this point, capacity collapses rapidly and the battery can fail without warning. This module calculates how many safe delivery cycles remain before that cliff is reached.",
    whatItDoes: [
      "Fits bi-exponential and dual-phase curvature models to historical battery cycle data.",
      "Calculates Remaining Safe Cycles (Cycles to Knee) before rapid capacity collapse.",
      "Allows fleet managers to schedule battery refurbishment or warranty claims 3 to 6 months in advance.",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "Cycles to Knee > 200 (Stable Linear Region)",
        meaning: "The battery is operating safely in its stable life window with minimal risk of sudden capacity drops.",
        action: "Vehicle is suitable for heavy daily commercial duty.",
      },
      {
        level: "warning",
        indicator: "Cycles to Knee 50 – 200 (Approaching Inflection)",
        meaning: "The battery is nearing its knee point within approximately 2 to 4 months of typical delivery usage.",
        action: "Alert procurement team to queue replacement battery modules or file warranty documentation.",
      },
      {
        level: "critical",
        indicator: "Past Knee Point (Exponential Degradation Phase)",
        meaning: "Capacity fade has accelerated significantly; high probability of sudden cell failure on the road.",
        action: "Reassign vehicle to short depot-only yard tasks or immediately schedule for pack replacement.",
      },
    ],
    glossary: [
      {
        term: "Knee Point",
        definition: "The critical elbow on a battery aging graph where degradation switches from slow and steady to steep and fast.",
      },
      {
        term: "EFC (Equivalent Full Cycles)",
        definition: "The total number of 100% full charges and discharges the battery has completed over its lifetime.",
      },
      {
        term: "Prognostics",
        definition: "Using mathematical models to forecast future equipment wear before unexpected breakdowns happen.",
      },
    ],
    proTip:
      "Replacing or refurbishing a battery just before its knee point prevents expensive tow-truck breakdowns, missed delivery SLAs, and vehicle downtime.",
  },

  "meta-ensemble": {
    id: "meta-ensemble",
    tabKey: "meta-ensemble",
    title: "Meta-Ensemble Diagnostic & Audit Report",
    subtitle: "Complete mathematical audit, cross-validation, and zero-leakage proof for all 74 models",
    badge: "Audit & Governance",
    roleBadge: "For: CTOs, Technical Auditors, Data Science Leads & Executives",
    icon: FileText,
    accentColor: "blue",
    summary:
      "Provides total transparency and mathematical accountability for all 74 Machine Learning models across the platform. It publishes 5-fold cross-validation accuracy, confusion matrices, test-set performance metrics, and zero-data-leakage verification on commercial Indian electric fleets.",
    whatItDoes: [
      "Audits all 74 Machine Learning models deployed across Modules A, B, and C.",
      "Proves zero data leakage between training, validation, and testing partitions.",
      "Documents empirical validation on real-world Indian delivery telematics (Euler HiLoad 12.4 kWh LFP).",
    ],
    inferences: [
      {
        level: "nominal",
        indicator: "99.7% F1 Thermal Safety Accuracy",
        meaning: "The safety classifier reliably separates safe operational heating from true thermal runaway risks.",
        action: "Platform algorithms certified for production dispatch decision automation.",
      },
      {
        level: "nominal",
        indicator: "Zero Data Leakage Verification",
        meaning: "Test vehicles were strictly separated from training sets, ensuring models generalize to brand new trucks.",
        action: "All predictions adhere to enterprise machine learning audit standards.",
      },
      {
        level: "warning",
        indicator: "Model Retraining Advisory",
        meaning: "If new vehicle models (e.g. different battery chemistries like NMC) are added to the fleet.",
        action: "Upload new chemistry baseline logs to expand model training envelopes.",
      },
    ],
    glossary: [
      {
        term: "Meta-Ensemble",
        definition: "Combining multiple specialized AI algorithms together for higher accuracy and reliability.",
      },
      {
        term: "F1 Score",
        definition: "A balanced accuracy metric measuring both false alarms and missed detections (99.7% is world-class).",
      },
      {
        term: "Zero Data Leakage",
        definition: "Ensuring testing data was never seen by models during training so real-world results are dependable.",
      },
    ],
    proTip:
      "Use this audit report when presenting to fleet insurance underwriters or executive leadership to prove the mathematical rigor behind automated dispatch decisions.",
  },
};

export const PageBriefingModal: React.FC = () => {
  const {
    briefingOpen,
    activeBriefingKey,
    closeBriefing,
    openBriefing,
    autoShowBriefing,
    setAutoShowBriefing,
    setCopilotOpen,
  } = useFleetStore();

  // Sync preference from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("ev_auto_show_page_briefing");
        if (saved !== null) {
          setAutoShowBriefing(saved === "true");
        }
      }
    } catch {}
  }, [setAutoShowBriefing]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && briefingOpen) {
        closeBriefing();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [briefingOpen, closeBriefing]);

  const activeContent: BriefingModuleContent =
    PAGE_BRIEFINGS[activeBriefingKey] || PAGE_BRIEFINGS["operations"];
  const IconComponent = activeContent.icon;

  const tabList = [
    { key: "operations", label: "Operations Hub", icon: Briefcase },
    { key: "fleet", label: "Fleet Twin", icon: LayoutDashboard },
    { key: "state-est", label: "State Estimation", icon: Cpu },
    { key: "thermal", label: "Thermal Safety", icon: Flame },
    { key: "behavior", label: "Driver Profiling", icon: Gauge },
    { key: "knee", label: "Knee Prognostics", icon: TrendingDown },
    { key: "meta-ensemble", label: "Meta Ensemble", icon: FileText },
  ];

  return (
    <AnimatePresence>
      {briefingOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-md transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBriefing();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* ─── TOP BAR WITH ROLE BADGE & CLOSE BUTTON ─── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Page Orientation & Employee Guide</span>
                </div>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
                  {activeContent.roleBadge}
                </span>
              </div>

              {/* Prominent Cross Button */}
              <button
                onClick={closeBriefing}
                aria-label="Close page orientation guide"
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── QUICK SWITCHER TABS ─── */}
            <div className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 no-scrollbar">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2 shrink-0">
                Switch Module:
              </span>
              {tabList.map((tab) => {
                const isActive = tab.key === activeContent.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => openBriefing(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ─── SCROLLABLE MAIN BRIEFING BODY ─── */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
              {/* Header section with Icon & Title */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 mt-0.5">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      id="briefing-title"
                      className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading"
                    >
                      {activeContent.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {activeContent.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {activeContent.subtitle}
                  </p>
                </div>
              </div>

              {/* ─── SECTION 1: WHAT THIS PAGE DOES ─── */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                  <BookOpen className="w-4 h-4" />
                  <span>1. What This Page Does (Plain English)</span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                  {activeContent.summary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {activeContent.whatItDoes.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── SECTION 2: WHAT TO INFER & ACTIONS TO TAKE ─── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-mono">
                  <Compass className="w-4 h-4" />
                  <span>2. What You Can Infer From This Page & Actions To Take</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeContent.inferences.map((inf, i) => {
                    const isNominal = inf.level === "nominal";
                    const isWarning = inf.level === "warning";
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                          isNominal
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                            : isWarning
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                            : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {isNominal ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : isWarning ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            ) : (
                              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            )}
                            <h4
                              className={`text-xs font-bold leading-tight ${
                                isNominal
                                  ? "text-emerald-900 dark:text-emerald-300"
                                  : isWarning
                                  ? "text-amber-900 dark:text-amber-300"
                                  : "text-rose-900 dark:text-rose-300"
                              }`}
                            >
                              {inf.indicator}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            {inf.meaning}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                            Action to take:
                          </div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {inf.action}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── SECTION 3: KEY TERMS GLOSSARY ─── */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  <HelpCircle className="w-4 h-4" />
                  <span>3. Key Terms Quick Glossary</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeContent.glossary.map((g, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {g.term}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {g.definition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── PRO TIP CALLOUT ─── */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 text-xs text-cyan-900 dark:text-cyan-200">
                <Lightbulb className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Shift Pro-Tip: </span>
                  <span>{activeContent.proTip}</span>
                </div>
              </div>
            </div>

            {/* ─── FOOTER BAR WITH CONTROLS ─── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
              {/* Checkbox preference */}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoShowBriefing}
                  onChange={(e) => setAutoShowBriefing(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Automatically show this guide when I click on a page</span>
              </label>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    closeBriefing();
                    setCopilotOpen(true);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ask Copilot</span>
                </button>

                <button
                  onClick={closeBriefing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  <span>Got It, Let&apos;s Work!</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
