"use client";

import React, { useState, useEffect } from "react";
import { useFleetStore } from "../../lib/store/useFleetStore";
import {
  predictSOC,
  predictSOH,
  predictRUL,
  predictMileage,
  predictThermal,
  predictDriverBehavior,
} from "../../lib/api/client";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  BatteryCharging,
  Thermometer,
  ShieldCheck,
  User,
  Truck,
  Search,
  Sparkles,
  ArrowUpRight,
  Info,
  Calendar,
  Zap,
  Gauge,
  Cpu,
  Activity,
  MapPin,
  Building2,
} from "lucide-react";
import { AIInsightsCard } from "./AIInsightsCard";
import { MetricExplainer } from "../ui/MetricExplainer";
import { getLiveTriage, getVehicleTriage, resolveLiveTriage, triageLabel, TriageLevel } from "../../lib/triage";



export const OperationsView: React.FC = () => {
  const {
    vehicles,
    selectedVehicleId,
    setSelectedVehicle,
    getSelectedVehicle,
    setViewMode,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    stateFilter,
    setStateFilter,
    manufacturerFilter,
    setManufacturerFilter,
    getFilteredVehicles,
    setSelectedLiveTriage,
  } = useFleetStore();

  const vehicle = getSelectedVehicle();
  const filteredVehicles = getFilteredVehicles();

  // Dynamic live prediction states
  const [soc, setSoc] = useState<number>(vehicle.soc || 75);
  const [soh, setSoh] = useState<number>(vehicle.soh || 95);
  const [rul, setRul] = useState<number>(vehicle.rul || 1000);
  const [range, setRange] = useState<number>(vehicle.mileage || 110);
  const [thermalSafe, setThermalSafe] = useState<boolean>(true);
  const [driverScore, setDriverScore] = useState<string>("Smooth (Eco)");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiUrgency, setAiUrgency] = useState<TriageLevel | null>(null);
  const [predictionsVehicleId, setPredictionsVehicleId] = useState<string>(vehicle.id);

  // Sync and fetch whenever selectedVehicleId changes
  useEffect(() => {
    let active = true;
    const targetVehicleId = vehicle.id;
    setLoading(true);
    setAiUrgency(null);


    Promise.allSettled([
      predictSOC({
        battery_voltage: vehicle.voltage,
        battery_temp: vehicle.battery_temp,
        battery_current: vehicle.current,
        abs_current: Math.abs(vehicle.current),
        odometer: vehicle.charge_cycle_count * 58,
        charge_cycle_count: vehicle.charge_cycle_count,
      }),
      predictSOH({
        battery_voltage: vehicle.voltage,
        battery_temp: vehicle.battery_temp,
        battery_current: vehicle.current,
        charge_cycle_count: vehicle.charge_cycle_count,
        odometer: vehicle.charge_cycle_count * 58,
        initial_soh: vehicle.soh,
        soh: vehicle.soh,
        chassis_no: vehicle.chassis,
        vehicle_id: vehicle.id,
      }),
      predictRUL({
        odometer: vehicle.charge_cycle_count * 58,
        charge_cycle_count: vehicle.charge_cycle_count,
        soc_at_charge: vehicle.soc,
        battery_temp: vehicle.battery_temp,
      }),
      predictMileage({
        run_kms: 45,
        avg_speed: vehicle.speed || 32,
        max_speed: (vehicle.speed || 32) + 20,
        odometer: vehicle.charge_cycle_count * 58,
        charge_cycle_count: vehicle.charge_cycle_count,
        battery_temp: vehicle.battery_temp,
        battery_voltage: vehicle.voltage,
      }),
      predictThermal({
        vbt: vehicle.battery_temp,
        vct: vehicle.controller_temp || (vehicle.battery_temp + 4),
        vmt: vehicle.motor_temp || (vehicle.battery_temp + 8),
        vbv: vehicle.voltage,
        vbc: vehicle.current,
        soc: vehicle.soc,
        speed: vehicle.speed,
      }),
      predictDriverBehavior({
        harsh_accel_count: vehicle.status === "warning" ? 4 : vehicle.status === "critical" ? 8 : 1,
        harsh_brake_count: vehicle.status === "critical" ? 5 : 1,
        harsh_corner_count: 1,
        speed_variance: 15,
        avg_speed: vehicle.speed || 32,
        max_speed: (vehicle.speed || 32) + 25,
        battery_temp_max: vehicle.battery_temp || 32,
        max_discharge_current: Math.abs(vehicle.current) || 25,
      }),
    ]).then(([socRes, sohRes, rulRes, rangeRes, thermRes, driverRes]) => {
      if (!active) return;
      if (socRes.status === "fulfilled" && socRes.value?.prediction !== undefined) {
        setSoc(socRes.value.prediction);
      } else {
        setSoc(vehicle.soc);
      }

      if (sohRes.status === "fulfilled" && sohRes.value?.prediction !== undefined) {
        setSoh(sohRes.value.prediction);
      } else {
        setSoh(vehicle.soh);
      }

      if (rulRes.status === "fulfilled" && rulRes.value?.prediction !== undefined) {
        setRul(Math.round(rulRes.value.prediction));
      } else {
        setRul(vehicle.rul || 1000);
      }

      if (rangeRes.status === "fulfilled" && rangeRes.value?.prediction !== undefined) {
        setRange(Math.round(rangeRes.value.prediction * 10) / 10);
      } else {
        setRange(vehicle.mileage || 110);
      }

      if (thermRes.status === "fulfilled" && thermRes.value) {
        const val = thermRes.value as any;
        const isSafe = !val.is_critical && (val.risk_probability === undefined || val.risk_probability < 0.35 || vehicle.battery_temp <= 38.0);
        setThermalSafe(isSafe);
      } else {
        setThermalSafe(vehicle.battery_temp <= 40.0);
      }

      if (driverRes.status === "fulfilled" && driverRes.value) {
        const ai = (driverRes.value as any).aggressiveness_index ?? 0.28;
        if (ai > 0.65) setDriverScore("Aggressive (High Strain)");
        else if (ai > 0.35) setDriverScore("Moderate (Normal)");
        else setDriverScore("Smooth (Eco-Pro)");
      }
      if (active && targetVehicleId === vehicle.id) {
        setPredictionsVehicleId(targetVehicleId);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedVehicleId, vehicle]);

  // Counts for triage bar
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const warningCount = vehicles.filter((v) => v.status === "warning").length;
  const criticalCount = vehicles.filter((v) => v.status === "critical").length;

  // Live triage for the selected vehicle resolved via single-owner precedence
  const liveTriage = resolveLiveTriage(
    aiUrgency,
    soh,
    soc,
    vehicle.battery_temp,
    vehicle.status
  );

  // Publish triage only after matching predictions load for the currently selected vehicle
  useEffect(() => {
    if (predictionsVehicleId === vehicle.id && !loading) {
      setSelectedLiveTriage(vehicle.id, liveTriage);
    }
  }, [predictionsVehicleId, vehicle.id, loading, liveTriage, setSelectedLiveTriage]);

  const isCritical = liveTriage === "CRITICAL";
  const isWarning  = liveTriage === "WARNING";

  // Estimated years of battery life left dynamically derived from ML RUL cycles (250 cycles/yr commercial fleet duty cycle)
  const estimatedYearsLeft = Math.max(0.1, Number((rul / 250).toFixed(1))).toFixed(1);



  return (
    <div className="space-y-6 w-full font-sans">
      {/* ─── 1. FLEET DISPATCH CLEARANCE LANES ─── */}
      <div className="tech-surface p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Fleet Dispatch Clearance
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {totalCount} Total Vehicles
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Three-lane operational dispatch readiness based on live battery telemetry and predictive health models.
            </p>
          </div>

          {/* Unified Fleet Ratio Meter */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Fleet Allocation:</span>
            <div className="w-48 sm:w-60 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(activeCount / totalCount) * 100}%` }}
                title={`Approved: ${activeCount} (${((activeCount / totalCount) * 100).toFixed(1)}%)`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(warningCount / totalCount) * 100}%` }}
                title={`Review: ${warningCount} (${((warningCount / totalCount) * 100).toFixed(1)}%)`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${(criticalCount / totalCount) * 100}%` }}
                title={`Grounded: ${criticalCount} (${((criticalCount / totalCount) * 100).toFixed(1)}%)`}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {((activeCount / totalCount) * 100).toFixed(0)}% Ready
            </span>
          </div>
        </div>

        {/* 4 Clickable Tactical Status Lanes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Monitored */}
          <button
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-800 border-cyan-500 shadow-md ring-2 ring-cyan-500/40"
                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
              <span className={statusFilter === "all" ? "text-cyan-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                All Vehicles
              </span>
              <Truck className={`w-4 h-4 ${statusFilter === "all" ? "text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 font-mono ${
              statusFilter === "all" ? "text-white" : "text-slate-900 dark:text-white"
            }`}>
              {totalCount} <span className={`text-xs font-normal font-sans ${statusFilter === "all" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>units</span>
            </div>
            <p className={`text-xs mt-1 ${statusFilter === "all" ? "text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
              Live Telemetry Synchronized
            </p>
          </button>

          {/* Lane A: Ready for Route */}
          <button
            onClick={() => setStatusFilter("active")}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === "active"
                ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/40"
                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
            }`}
          >
            <div className={`flex justify-between items-center text-xs font-semibold uppercase tracking-wider ${
              statusFilter === "active" ? "text-emerald-800 dark:text-emerald-300 font-bold" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ready to Dispatch</span>
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 font-mono ${
              statusFilter === "active" ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {activeCount} <span className={`text-xs font-normal font-sans ${
                statusFilter === "active" ? "text-emerald-800 dark:text-emerald-400" : "opacity-70"
              }`}>units</span>
            </div>
            <p className={`text-xs mt-1 ${
              statusFilter === "active" ? "text-emerald-800 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"
            }`}>
              Optimal Battery Health & Range
            </p>
          </button>

          {/* Lane B: Needs Charge / Advisory */}
          <button
            onClick={() => setStatusFilter("warning")}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === "warning"
                ? "bg-amber-50 dark:bg-amber-950/70 border-amber-500 shadow-md ring-2 ring-amber-500/40"
                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/40"
            }`}
          >
            <div className={`flex justify-between items-center text-xs font-semibold uppercase tracking-wider ${
              statusFilter === "warning" ? "text-amber-800 dark:text-amber-300 font-bold" : "text-amber-600 dark:text-amber-400"
            }`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Review / Advisory</span>
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 font-mono ${
              statusFilter === "warning" ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400"
            }`}>
              {warningCount} <span className={`text-xs font-normal font-sans ${
                statusFilter === "warning" ? "text-amber-800 dark:text-amber-400" : "opacity-70"
              }`}>units</span>
            </div>
            <p className={`text-xs mt-1 ${
              statusFilter === "warning" ? "text-amber-800 dark:text-amber-300 font-medium" : "text-slate-500 dark:text-slate-400"
            }`}>
              Low Charge or Moderate Temp
            </p>
          </button>

          {/* Lane C: Critical Hold / Service */}
          <button
            onClick={() => setStatusFilter("critical")}
            className={`p-4 rounded-xl border text-left transition-all ${
              statusFilter === "critical"
                ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 shadow-md ring-2 ring-rose-500/40"
                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-500/40"
            }`}
          >
            <div className={`flex justify-between items-center text-xs font-semibold uppercase tracking-wider ${
              statusFilter === "critical" ? "text-rose-800 dark:text-rose-300 font-bold" : "text-rose-600 dark:text-rose-400"
            }`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Maintenance Hold</span>
              </span>
              <AlertOctagon className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 font-mono ${
              statusFilter === "critical" ? "text-rose-700 dark:text-rose-300" : "text-rose-600 dark:text-rose-400"
            }`}>
              {criticalCount} <span className={`text-xs font-normal font-sans ${
                statusFilter === "critical" ? "text-rose-800 dark:text-rose-400" : "opacity-70"
              }`}>units</span>
            </div>
            <p className={`text-xs mt-1 ${
              statusFilter === "critical" ? "text-rose-800 dark:text-rose-300 font-medium" : "text-slate-500 dark:text-slate-400"
            }`}>
              Grounded · Inspection Required
            </p>
          </button>
        </div>
      </div>

      {/* ─── 2. SELECTED VEHICLE TELEMETRY OVERVIEW ─── */}
      <div className="tech-surface p-5 sm:p-6 space-y-5">
        {/* Chassis Title Header & Multi-Filter Control Console */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Vehicle:</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {vehicle.id}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isCritical
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400"
                    : isWarning
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"
                }`}
              >
                {triageLabel(liveTriage)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-sans">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.model}</span>
              <span>•</span>
              <span>Driver: <strong className="text-slate-800 dark:text-slate-200">{vehicle.driver}</strong></span>
              <span>•</span>
              <span>Hub: {vehicle.fleet}</span>
              <span>•</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">12.4 kWh LFP Battery</span>
            </div>
          </div>

          {/* Quick Vehicle Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by VIN or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* Manufacturer OEM Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
                title="Filter by OEM"
              >
                <option value="all" className="bg-white dark:bg-slate-900">All OEMs</option>
                <option value="euler" className="bg-white dark:bg-slate-900">Euler HiLoad</option>
                <option value="tata" className="bg-white dark:bg-slate-900">Tata Ace EV</option>
                <option value="mahindra" className="bg-white dark:bg-slate-900">Mahindra EV</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
                title="Filter by State"
              >
                <option value="all" className="bg-white dark:bg-slate-900">All Regions</option>
                <option value="DL" className="bg-white dark:bg-slate-900">Delhi (DL)</option>
                <option value="GJ" className="bg-white dark:bg-slate-900">Gujarat (GJ)</option>
                <option value="KA" className="bg-white dark:bg-slate-900">Karnataka (KA)</option>
                <option value="MH" className="bg-white dark:bg-slate-900">Maharashtra (MH)</option>
                <option value="TN" className="bg-white dark:bg-slate-900">Tamil Nadu (TN)</option>
                <option value="UP" className="bg-white dark:bg-slate-900">Uttar Pradesh (UP)</option>
              </select>
            </div>

            {/* Active Chassis Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
              <Truck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <select
                value={vehicle.id}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-cyan-300 focus:outline-none cursor-pointer max-w-[170px] truncate font-mono"
              >
                {filteredVehicles.length === 0 ? (
                  <option value="" disabled className="bg-white dark:bg-slate-900">No trucks</option>
                ) : (
                  filteredVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {v.id} · {v.soc.toFixed(0)}% SOC
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={() => {
                setViewMode("engineering");
                setActiveTab("state-est");
              }}
              className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shrink-0 transition-colors shadow-xs"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deep Diagnostics</span>
            </button>
          </div>
        </div>

        {/* ─── ACTION DIRECTIVE STAMP ─── */}
        <div
          className={`p-4 sm:p-5 rounded-xl flex items-start gap-3.5 border ${
            isCritical
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200"
              : isWarning
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
          }`}
        >
          {isCritical ? (
            <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <div className="font-bold text-sm sm:text-base">
              {isCritical
                ? "Dispatch Advisory: Critical Service Required"
                : isWarning
                ? "Dispatch Advisory: Review Route Conditions"
                : "Dispatch Approved: Vehicle Cleared for Route Shift"}
            </div>
            <p className="leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {isCritical
                ? vehicle.battery_temp > 48
                  ? `Elevated pack core temperature (${vehicle.battery_temp.toFixed(1)}°C). Vehicle grounded for cooling and thermal airflow inspection prior to dispatch.`
                  : `Accelerated cell capacity fade detected (SOH: ${soh.toFixed(1)}%, ${vehicle.charge_cycle_count} cycles). Hold vehicle for cell balancing inspection.`
                : isWarning
                ? soh < 85.0
                  ? `Moderate capacity retention wear (SOH: ${soh.toFixed(1)}%). Recommended for standard urban routes up to ${range.toFixed(0)} km.`
                  : soc < 30.0
                  ? `Usable charge reserve is low (${soc.toFixed(0)}% SOC). Recommend a 30-minute top-up charge prior to route assignment.`
                  : !thermalSafe
                  ? `Drivetrain thermal gradient detected (Motor: ${(vehicle.motor_temp || 45.0).toFixed(1)}°C vs Pack: ${vehicle.battery_temp.toFixed(1)}°C). Monitor cooling under heavy cargo.`
                  : `Operating under thermal advisory (${vehicle.battery_temp.toFixed(1)}°C). Limit continuous high-speed transit.`
                : `Pack operates normally at ${soc.toFixed(1)}% SOC with ${range.toFixed(0)} km estimated delivery range. Cell voltages, thermal gradient, and driver history are fully certified.`}
            </p>
          </div>
        </div>

        {/* ─── 4 MAIN INSTRUMENTS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Instrument 1: Usable Fuel (SOC) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-cyan-500" />
                  <span>State of Charge</span>
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">Fuel</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight my-1">
                {soc.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Estimated Range: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{range.toFixed(0)} km</strong>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Usable Energy: {((soc / 100) * 12.4).toFixed(1)} kWh / 12.4 kWh
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              {/* Segmented Fuel Bar */}
              <div className="grid grid-cols-10 gap-1 h-2.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const filled = soc >= (i + 1) * 10;
                  return (
                    <div
                      key={i}
                      className={`h-full rounded-xs transition-colors ${
                        filled
                          ? soc > 20
                            ? "bg-cyan-500"
                            : "bg-amber-500"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                <span>Voltage: {vehicle.voltage.toFixed(1)} V</span>
                <span>Current: {vehicle.current.toFixed(1)} A</span>
              </div>
            </div>
          </div>

          {/* Instrument 2: Capacity Health (SOH) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>State of Health</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Health</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight my-1">
                {soh.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Estimated Life: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">~{estimatedYearsLeft} Years</strong>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Retained Capacity: {((soh / 100) * 150).toFixed(1)} Ah / 150 Ah
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, soh))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                <span>{vehicle.charge_cycle_count} Cycles</span>
                <span>RUL: {rul} CYC</span>
              </div>
            </div>
          </div>

          {/* Instrument 3: Thermal Gradient */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  <span>Battery Temperature</span>
                </span>
                <span className="text-amber-500 font-bold">Thermal</span>
              </div>
              <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight my-1 ${vehicle.battery_temp > 45 ? "text-amber-500" : "text-slate-900 dark:text-white"}`}>
                {vehicle.battery_temp.toFixed(1)}°C
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Safety Margin: <strong className="text-slate-900 dark:text-slate-100 font-bold">{(45 - vehicle.battery_temp).toFixed(1)}°C Headroom</strong>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Motor: {(vehicle.motor_temp || 45.0).toFixed(1)}°C · Inverter: {(vehicle.controller_temp || 40.0).toFixed(1)}°C
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Cooling State:</span>
                <span className={thermalSafe ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                  {thermalSafe ? "Optimal" : "Active Forced"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                <span>Ambient: 28.0°C</span>
                <span>Runaway: 0.0%</span>
              </div>
            </div>
          </div>

          {/* Instrument 4: Driver Powertrain Stress */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-500" />
                  <span>Driving Behavior</span>
                </span>
                <span className="text-purple-500 font-bold">Stress</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight my-1">
                {driverScore.split(" ")[0]}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Throttle Behavior: <strong className={driverScore.includes("Aggressive") ? "text-rose-500" : "text-emerald-500"}>
                  {driverScore.includes("Aggressive") ? "High Transient" : "Eco-Calibrated"}
                </strong>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Speed: {vehicle.speed.toFixed(0)} km/h · Peak: {Math.abs(vehicle.current).toFixed(0)}A
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Lifetime Impact:</span>
                <span className={driverScore.includes("Aggressive") ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                  {driverScore.includes("Aggressive") ? "-1.2 Years" : "+1.8 Years Extended"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                <span>Harsh Events: {vehicle.status === "critical" ? 8 : 1}/shift</span>
                <span>Torque: Normal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DUAL-HORIZON ELECTROCHEMICAL SPECIFICATION CALLOUT ─── */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Understanding Battery Health Metrics (SOC vs. SOH)
              </span>
            </div>
            <MetricExplainer
              metricKey="soc_vs_soh"
              label="How it works"
              variant="badge"
              className="text-xs font-semibold py-1 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5">
                <span>State of Charge (SOC) · Usable Fuel</span>
                <span className="font-mono text-sm">{soc.toFixed(1)}%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Transient usable energy reserve. Depletes dynamically while driving and restores to 100% on AC/DC charging. Reversible operational metric.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1.5">
                <span>State of Health (SOH) · Asset Longevity</span>
                <span className="font-mono text-sm">{soh.toFixed(1)}%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Permanent electrochemical capacity relative to the factory baseline (150 Ah). Degrades gradually over 5–8 years due to usage and aging. Irreversible metric.
              </p>
            </div>
          </div>
        </div>

        {/* AI Powertrain Diagnostic Card */}
        <AIInsightsCard
          vehicle={vehicle}
          livePredictions={{ soc, soh, rul, mileage: range }}
          onUrgencyChange={(urg) => setAiUrgency(urg)}
        />

        {/* ─── 4. QUICK FLEET SWITCHER GRID ─── */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-500" />
                <span>Quick Fleet Vehicle Switcher</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any vehicle to switch live telemetry view. Showing {getFilteredVehicles().slice(0, 8).length} of {getFilteredVehicles().length} vehicles.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Live Auto-Refresh
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {getFilteredVehicles().slice(0, 8).map((v) => {
              const isSelected = v.id.toUpperCase() === vehicle.id.toUpperCase();
              const displaySoc = isSelected ? soc : v.soc;
              const displaySoh = isSelected ? soh : v.soh;
              const triage = getVehicleTriage(v);
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all text-xs flex justify-between items-center ${
                    isSelected
                      ? "bg-slate-900 text-white border-cyan-500 ring-2 ring-cyan-500/30 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold font-mono text-xs">
                      <span className={`w-2 h-2 rounded-full ${triage === 'CRITICAL' ? 'bg-rose-500' : triage === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span>{v.id}</span>
                    </div>
                    <div className={`text-xs truncate max-w-[100px] ${isSelected ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                      {v.driver}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-xs">
                      {displaySoc.toFixed(0)}%{" "}
                      <span className={`text-[10px] ${isSelected ? "text-cyan-300" : "text-cyan-600 dark:text-cyan-400"}`}>
                        SOC
                      </span>
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        triage === "CRITICAL"
                          ? isSelected
                            ? "text-rose-300"
                            : "text-rose-600 dark:text-rose-400"
                          : triage === "WARNING"
                          ? isSelected
                            ? "text-amber-300"
                            : "text-amber-600 dark:text-amber-400"
                          : isSelected
                          ? "text-emerald-300"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {displaySoh.toFixed(1)}% SOH
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OperationsView;

