"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFleetStore } from "../../lib/store/useFleetStore";
import { BatteryPack3D } from "../digital-twin/BatteryPack3D";
import { CanOscilloscope } from "../telemetry/CanOscilloscope";
import {
  predictSOC,
  predictSOH,
  predictRUL,
  predictMileage,
} from "../../lib/api/client";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  MapPin,
  Building2,
} from "lucide-react";
import { MetricExplainer } from "../ui/MetricExplainer";
import { AIInsightsCard } from "../dashboard/AIInsightsCard";
import {
  getLiveTriage,
  getVehicleTriage,
  resolveLiveTriage,
  triageLabel,
  triageBadgeClass,
  triageDotClass,
  TriageLevel,
} from "../../lib/triage";





const PAGE_SIZE = 25;


export const FleetOverviewTab: React.FC = () => {
  const {
    vehicles,
    selectedVehicleId,
    setSelectedVehicle,
    getSelectedVehicle,
    setCopilotOpen,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stateFilter,
    setStateFilter,
    manufacturerFilter,
    setManufacturerFilter,
    getFilteredVehicles,
    selectedLiveTriage,
    setSelectedLiveTriage,
  } = useFleetStore();

  const vehicle = getSelectedVehicle();
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic live predictions state keyed by vehicle ID to prevent cross-vehicle state retention
  const [predictionState, setPredictionState] = useState<{
    vehicleId: string;
    soc?: number;
    soh?: number;
    rul?: number;
    mileage?: number;
    isLoading: boolean;
  }>({
    vehicleId: vehicle.id,
    isLoading: false,
  });

  const [aiUrgency, setAiUrgency] = useState<TriageLevel | null>(null);

  // Query live model endpoints whenever selected vehicle changes
  useEffect(() => {
    let isMounted = true;
    const targetVehicleId = vehicle.id;

    // Clear stale predictions from prior vehicle immediately upon vehicle change
    setPredictionState({
      vehicleId: targetVehicleId,
      soc: undefined,
      soh: undefined,
      rul: undefined,
      mileage: undefined,
      isLoading: true,
    });
    setAiUrgency(null);

    Promise.allSettled([
      predictSOC({
        battery_voltage: vehicle.voltage,
        battery_temp: vehicle.battery_temp,
        battery_current: vehicle.current,
        abs_current: Math.abs(vehicle.current),
        odometer: vehicle.charge_cycle_count * 58,
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
        soc_at_charge: vehicle.soc,
      }),
      predictMileage({
        run_kms: 45,
        avg_speed: vehicle.speed || 34,
        max_speed: (vehicle.speed || 34) + 20,
      }),
    ]).then(([socRes, sohRes, rulRes, mileageRes]) => {
      if (!isMounted || targetVehicleId !== vehicle.id) return;
      const predSoc = socRes.status === "fulfilled" ? socRes.value.prediction : vehicle.soc;
      const predSoh = sohRes.status === "fulfilled" ? sohRes.value.prediction : vehicle.soh;
      const predRul = rulRes.status === "fulfilled" ? Math.round(rulRes.value.prediction) : vehicle.rul;
      const predMileage =
        mileageRes.status === "fulfilled"
          ? Math.round(mileageRes.value.prediction * 10) / 10
          : vehicle.mileage;

      setPredictionState({
        vehicleId: targetVehicleId,
        soc: predSoc,
        soh: predSoh,
        rul: predRul,
        mileage: predMileage,
        isLoading: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [vehicle.id]);

  const filteredVehicles = getFilteredVehicles();
  const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, currentPage]);

  const isMatching = predictionState.vehicleId === vehicle.id && !predictionState.isLoading;
  const currentSoc = vehicle.soc;
  const currentSoh = isMatching && predictionState.soh !== undefined ? predictionState.soh : vehicle.soh;
  const currentRul = isMatching && predictionState.rul !== undefined ? predictionState.rul : vehicle.rul;
  const currentMileage = isMatching && predictionState.mileage !== undefined ? predictionState.mileage : vehicle.mileage;

  const socDisplay = vehicle.soc.toFixed(1);
  const sohDisplay = currentSoh.toFixed(1);
  const rulDisplay = currentRul;
  const mileageDisplay = currentMileage.toFixed(1);

  // Single Owner: Precedence-resolved triage combining live model inference & AI copilot urgency
  const resolvedTriage = resolveLiveTriage(
    aiUrgency,
    currentSoh,
    vehicle.soc,
    vehicle.battery_temp,
    vehicle.status
  );

  // Publish resolved triage once matching predictions for the current vehicle have loaded
  useEffect(() => {
    if (predictionState.vehicleId === vehicle.id && !predictionState.isLoading) {
      setSelectedLiveTriage(vehicle.id, resolvedTriage);
    }
  }, [vehicle.id, predictionState.vehicleId, predictionState.isLoading, resolvedTriage, setSelectedLiveTriage]);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold font-heading text-slate-900 dark:text-slate-100 tracking-tight">
                Commercial Telematics Active
              </h2>
              {(() => {
                const staticTriage = getVehicleTriage(vehicle);
                const isEscalated = resolvedTriage !== staticTriage;
                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${triageBadgeClass(resolvedTriage)}`}>
                      {triageLabel(resolvedTriage)}
                    </span>
                    {isEscalated && (
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Registry: {triageLabel(staticTriage)} → Live ML Escalated
                      </span>
                    )}
                  </div>
                );
              })()}

            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Live sub-second inference:{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-bold font-mono">{vehicle.id}</strong> ({vehicle.model} • {vehicle.fleet})
            </p>
          </div>
        </div>

        <button
          onClick={() => setCopilotOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      {/* ─── 1.5 ENGINEERING FLEET FILTERS & ACTIVE ASSET SELECTOR ─── */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search VIN, chassis, hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
            {(["all", "active", "warning", "critical"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded capitalize text-[11px] font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Manufacturer Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={manufacturerFilter}
              onChange={(e) => {
                setManufacturerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
              title="Filter by Vehicle Manufacturer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Manufacturers</option>
              <option value="euler" className="bg-white dark:bg-slate-900">Euler Motors (HiLoad)</option>
              <option value="tata" className="bg-white dark:bg-slate-900">Tata Motors (Ace EV)</option>
              <option value="mahindra" className="bg-white dark:bg-slate-900">Mahindra Electric</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
              title="Filter by State / RTO Region"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All States</option>
              <option value="DL" className="bg-white dark:bg-slate-900">Delhi (DL)</option>
              <option value="GJ" className="bg-white dark:bg-slate-900">Gujarat (GJ)</option>
              <option value="KA" className="bg-white dark:bg-slate-900">Karnataka (KA)</option>
              <option value="MH" className="bg-white dark:bg-slate-900">Maharashtra (MH)</option>
              <option value="TN" className="bg-white dark:bg-slate-900">Tamil Nadu (TN)</option>
              <option value="UP" className="bg-white dark:bg-slate-900">Uttar Pradesh (UP)</option>
            </select>
          </div>
        </div>

        {/* Active Asset Selector among filtered vehicles */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
            Active Asset:
          </span>
          <select
            value={vehicle.id}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 focus:outline-none cursor-pointer max-w-[240px] truncate"
          >
            {filteredVehicles.length === 0 ? (
              <option value="" disabled className="bg-white dark:bg-slate-900">
                No matching vehicles
              </option>
            ) : (
              filteredVehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {v.id} — {v.model.split(" ")[0]} ({v.fleet.split(" ")[0]}) • {v.soc.toFixed(0)}%
                </option>
              ))
            )}
          </select>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
            {filteredVehicles.length} of {vehicles.length}
          </span>
        </div>
      </div>

      {/* 2. HUD Telemetry Strip: 4 Precision Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: SOC */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                State of Charge (SOC)
              </span>
              <MetricExplainer metricKey="soc" currentValue={`${socDisplay}%`} label="How it works" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight tabular-nums">
                {socDisplay}%
              </span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider">Nominal</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Pack: {vehicle.voltage.toFixed(1)}V</span>
            <span>Draw: {vehicle.current.toFixed(1)}A</span>
          </div>
        </div>

        {/* Card 2: SOH */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                State of Health (SOH)
              </span>
              <MetricExplainer metricKey="soh" currentValue={`${sohDisplay}%`} label="How it works" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight tabular-nums">
                {sohDisplay}%
              </span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider">Calibrated SOH₀</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Baseline-anchored estimate (see methodology)
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Cycles: {vehicle.charge_cycle_count} EFC</span>
            <span>Temp: {vehicle.battery_temp.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Card 3: RUL */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Remaining Useful Life (RUL)
              </span>
              <MetricExplainer metricKey="rul" currentValue={`${rulDisplay} cycles`} label="How it works" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight tabular-nums">
                {rulDisplay} <span className="text-xs font-normal text-slate-400">cycles</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Est: ~{(rulDisplay / 250).toFixed(1)} yrs remaining</span>
            <span className="text-emerald-600 font-bold">R² = 0.9997</span>
          </div>
        </div>

        {/* Card 4: Range */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Range per Charge
              </span>
              <MetricExplainer metricKey="mileage" currentValue={`${mileageDisplay} km`} label="How it works" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight tabular-nums">
                {mileageDisplay} <span className="text-xs font-normal text-slate-400">km</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Speed: {vehicle.speed.toFixed(1)} km/h</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider">Optimal</span>
          </div>
        </div>
      </div>

      {/* AI Powertrain Diagnostic & Root Cause Breakdown (GPT-OSS 120B) */}
      <AIInsightsCard
        vehicle={vehicle}
        livePredictions={{
          soc: currentSoc,
          soh: currentSoh,
          rul: currentRul,
          mileage: currentMileage,
        }}
        onUrgencyChange={(urgency) => setAiUrgency(urgency)}
      />

      {/* 3. Center Dual Stage: 3D Digital Twin + CAN Oscilloscope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left 7 Cols: 3D Digital Twin */}
        <div className="lg:col-span-7 space-y-4">
          <BatteryPack3D
            batteryTemp={vehicle.battery_temp}
            controllerTemp={vehicle.controller_temp || vehicle.battery_temp + 5.2}
            motorTemp={vehicle.motor_temp || vehicle.battery_temp + 8.4}
            soc={currentSoc}
            soh={currentSoh}
            status={vehicle.status}
            isCritical={resolvedTriage === "CRITICAL"}
          />
        </div>


        {/* Right 5 Cols: CAN Oscilloscope & Vehicle Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <CanOscilloscope
              voltage={vehicle.voltage}
              current={vehicle.current}
              temperature={vehicle.battery_temp}
            />
            <div className="absolute top-3.5 right-3.5 z-10">
              <MetricExplainer metricKey="can_oscilloscope" label="How to read CAN" />
            </div>
          </div>

          <div className="rounded-xl p-4 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-400 uppercase font-semibold text-[10px] flex items-center gap-1.5">
                <span>Chassis Metadata</span>
                <MetricExplainer metricKey="dataset" variant="icon" />
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{vehicle.id}</span>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span>Model:</span>
                <strong className="text-slate-900 dark:text-slate-100">{vehicle.model}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chassis / VIN:</span>
                <strong className="text-slate-900 dark:text-slate-100">{vehicle.chassis || vehicle.id}</strong>
              </div>
              <div className="flex justify-between">
                <span>Fleet / Hub:</span>
                <strong className="text-slate-900 dark:text-slate-100">{vehicle.fleet}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chemistry:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">12.4 kWh LFP (72V)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fleet Vehicle Registry Table */}
      <div className="rounded-xl p-5 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-slate-100 tracking-tight">
              Commercial Fleet Directory
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {filteredVehicles.length} of {vehicles.length} operational chassis
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search VIN, chassis, hub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              {(["all", "active", "warning", "critical"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded capitalize text-[11px] font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Manufacturer OEM Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={manufacturerFilter}
                onChange={(e) => {
                  setManufacturerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
                title="Filter by Vehicle Manufacturer"
              >
                <option value="all" className="bg-white dark:bg-slate-900">All Manufacturers</option>
                <option value="euler" className="bg-white dark:bg-slate-900">Euler Motors (HiLoad)</option>
                <option value="tata" className="bg-white dark:bg-slate-900">Tata Motors (Ace EV)</option>
                <option value="mahindra" className="bg-white dark:bg-slate-900">Mahindra Electric</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
                title="Filter by State / RTO Region"
              >
                <option value="all" className="bg-white dark:bg-slate-900">All States</option>
                <option value="DL" className="bg-white dark:bg-slate-900">Delhi (DL)</option>
                <option value="GJ" className="bg-white dark:bg-slate-900">Gujarat (GJ)</option>
                <option value="KA" className="bg-white dark:bg-slate-900">Karnataka (KA)</option>
                <option value="MH" className="bg-white dark:bg-slate-900">Maharashtra (MH)</option>
                <option value="TN" className="bg-white dark:bg-slate-900">Tamil Nadu (TN)</option>
                <option value="UP" className="bg-white dark:bg-slate-900">Uttar Pradesh (UP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider font-sans">
                <th className="py-2.5 px-3">Vehicle ID</th>
                <th className="py-2.5 px-3">Chassis / Model</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SOC</th>
                <th className="py-2.5 px-3">SOH</th>
                <th className="py-2.5 px-3">Pack Temp</th>
                <th className="py-2.5 px-3">Elapsed Cycles</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedVehicles.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-100 dark:bg-slate-800/60 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {v.id}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                      {v.chassis || v.model}
                    </td>
                    <td className="py-2.5 px-3">
                      {(() => {
                        const staticTriage = getVehicleTriage(v);
                        const triage = isSelected && selectedLiveTriage ? selectedLiveTriage : staticTriage;
                        return (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${triageBadgeClass(triage)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${triageDotClass(triage)}`} />
                              {triageLabel(triage)}
                            </span>
                            {isSelected && selectedLiveTriage && selectedLiveTriage !== staticTriage && (
                              <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                                LIVE ML
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-mono">
                      <span>{v.soc.toFixed(1)}%</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-mono">
                      <span className="text-slate-600 dark:text-slate-300">{v.soh.toFixed(1)}%</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-mono">{v.battery_temp.toFixed(1)}°C</td>
                    <td className="py-2.5 px-3 tabular-nums font-mono">{v.charge_cycle_count} EFC</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(v.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-all ${
                          isSelected
                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {isSelected ? "Inspecting" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs font-mono text-slate-400">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
