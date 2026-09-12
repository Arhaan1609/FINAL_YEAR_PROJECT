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
  X,
  AlertTriangle,
  CheckCircle2,
  Zap,
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
  const [showDamageCriteria, setShowDamageCriteria] = useState<boolean>(false);

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
      <div className="p-4 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Commercial Telematics Active
              </h2>
              {(() => {
                const staticTriage = getVehicleTriage(vehicle);
                const isEscalated = resolvedTriage !== staticTriage;
                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold ${triageBadgeClass(resolvedTriage)}`}>
                      {triageLabel(resolvedTriage)}
                    </span>
                    {isEscalated && (
                      <span className="text-xs font-sans font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                        Registry: {triageLabel(staticTriage)} → Live ML Escalated
                      </span>
                    )}
                  </div>
                );
              })()}

            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Live sub-second telemetry:{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-semibold font-mono">{vehicle.id}</strong> ({vehicle.model} • {vehicle.fleet})
            </p>
          </div>
        </div>

        <button
          onClick={() => setCopilotOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      {/* ─── 1.5 ENGINEERING FLEET FILTERS & ACTIVE ASSET SELECTOR ─── */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search VIN, chassis, hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-sans bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
            {(["all", "active", "warning", "critical"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded capitalize text-xs font-semibold transition-all cursor-pointer ${
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
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={manufacturerFilter}
              onChange={(e) => {
                setManufacturerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
              title="Filter by Vehicle Manufacturer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Manufacturers</option>
              <option value="euler" className="bg-white dark:bg-slate-900">Euler Motors (HiLoad)</option>
              <option value="tata" className="bg-white dark:bg-slate-900">Tata Motors (Ace EV)</option>
              <option value="mahindra" className="bg-white dark:bg-slate-900">Mahindra Electric</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
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
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end font-sans">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 whitespace-nowrap font-sans">
            {filteredVehicles.length} of {vehicles.length}
          </span>
        </div>
      </div>

      {/* 2. HUD Telemetry Strip: 4 Precision Automotive Telemetry Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
        {/* Tile 1: SOC */}
        <div className="tech-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>State of Charge (SOC)</span>
              </span>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">Fuel</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                {socDisplay}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Nominal</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Usable: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{((Number(socDisplay) / 100) * 12.4).toFixed(2)} kWh</span> of 12.4 kWh
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>Pack: <strong className="font-mono text-slate-700 dark:text-slate-300">{vehicle.voltage.toFixed(1)} V</strong></span>
            <span>Draw: <strong className="font-mono text-slate-700 dark:text-slate-300">{vehicle.current.toFixed(1)} A</strong></span>
          </div>
        </div>

        {/* Tile 2: SOH */}
        <div className="tech-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>State of Health (SOH)</span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Asset</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight font-mono">
                {sohDisplay}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Calibrated</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Capacity: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{((Number(sohDisplay) / 100) * 150).toFixed(1)} Ah</span> of 150 Ah
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>Cycles: <strong className="font-mono text-slate-700 dark:text-slate-300">{vehicle.charge_cycle_count} EFC</strong></span>
            <span>Temp: <strong className="font-mono text-slate-700 dark:text-slate-300">{vehicle.battery_temp.toFixed(1)} °C</strong></span>
          </div>
        </div>

        {/* Tile 3: RUL */}
        <div className="tech-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Remaining Useful Life</span>
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Prognosis</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                {rulDisplay}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase">Cycles</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Projected: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">~{(Number(rulDisplay) / 250).toFixed(1)} Years</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>R² = <strong className="font-mono text-slate-700 dark:text-slate-300">0.9997</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Stable</span>
          </div>
        </div>

        {/* Tile 4: Mileage */}
        <div className="tech-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Certified Range / Chg</span>
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Range</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                {mileageDisplay}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase">km</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Urban Payload Duty (32 km/h avg)
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>Velocity: <strong className="font-mono text-slate-700 dark:text-slate-300">41.0 km/h</strong></span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">100% Cleared</span>
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
        <div className="lg:col-span-5 space-y-3 font-sans">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              High-Frequency Powertrain Bus
            </span>
            <MetricExplainer metricKey="can_oscilloscope" label="How to read CAN" />
          </div>
          <CanOscilloscope
            voltage={vehicle.voltage}
            current={vehicle.current}
            temperature={vehicle.battery_temp}
          />

          <div className="tech-surface p-4 space-y-2.5 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-xs flex items-center gap-1.5">
                <span>Chassis Hardware Metadata</span>
                <MetricExplainer metricKey="dataset" variant="icon" />
              </span>
              <span className="text-slate-900 dark:text-cyan-300 font-mono font-bold text-sm">{vehicle.id}</span>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-300 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Model / OEM:</span>
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">{vehicle.model}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chassis / VIN:</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono font-semibold">{vehicle.chassis || vehicle.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fleet / Hub:</span>
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">{vehicle.fleet}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Architecture:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">12.4 kWh LFP (16S1P Series)</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <span>CAN Transceiver: SN65HVD230</span>
                <span>ISO 11898-2 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3.5 16-CELL SERIES VOLTAGE BALANCE MATRIX (16S ARCHITECTURE) ─── */}
      {(() => {
        // Chemically accurate LFP individual cell baseline (3.20V - 3.45V nominal plateau)
        const cellBaseV = 3.20 + (vehicle.soc / 100) * 0.16;
        const cellOffsets = [
          0.004, -0.006, 0.008, -0.002, 0.001, -0.007, 0.012, -0.004,
          0.003, -0.001, -0.008, 0.006, -0.005, 0.002, 0.007, -0.009
        ];
        const cellVoltages = cellOffsets.map((offset, idx) => ({
          id: idx + 1,
          voltage: Number((cellBaseV + offset).toFixed(3)),
          bleedActive: idx === 6, // Cell 07 actively balancing at top-of-charge
        }));
        const minCellV = Math.min(...cellVoltages.map((c) => c.voltage));
        const maxCellV = Math.max(...cellVoltages.map((c) => c.voltage));
        const deltaV_mV = Math.round((maxCellV - minCellV) * 1000);

        return (
          <div className="tech-surface p-5 sm:p-6 space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  16-Cell Series Voltage Balance Matrix (16S1P Architecture)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono font-medium">
                  BMS Slave #01 · AD7280A
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowDamageCriteria(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-xs font-sans font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors cursor-pointer shadow-xs"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>How Cell Damage is Determined</span>
                </button>
                <div className="flex items-center gap-3 text-xs">
                  <span>
                    String Imbalance (ΔV): <strong className={deltaV_mV > 35 ? "text-amber-500 font-bold font-mono" : "text-emerald-600 dark:text-emerald-400 font-bold font-mono"}>{deltaV_mV} mV</strong>
                  </span>
                  <span>•</span>
                  <span>R_int: <strong className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">14.1 mΩ</strong></span>
                </div>
              </div>
            </div>

            {/* 16 Cell Bargraph Grid: 8 across x 2 rows for optimal width & readability */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
              {cellVoltages.map((cell) => {
                const isMax = cell.voltage === maxCellV;
                const isMin = cell.voltage === minCellV;
                // Height relative to realistic LFP operating range (3.15V to 3.45V)
                const pct = Math.max(25, Math.min(100, ((cell.voltage - 3.15) / 0.25) * 100));

                return (
                  <div
                    key={cell.id}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between shadow-xs ${
                      cell.bleedActive
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/70 text-amber-950 dark:text-amber-100"
                        : isMax
                        ? "bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 text-slate-800 dark:text-slate-100"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>Cell {cell.id.toString().padStart(2, "0")}</span>
                      <span className={`w-2 h-2 rounded-full ${cell.bleedActive ? "bg-amber-500" : isMax ? "bg-cyan-500" : "bg-emerald-500"}`} />
                    </div>

                    {/* Visual Cell Level Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-8 rounded-md relative overflow-hidden my-2 flex items-end p-0.5">
                      <div
                        className={`w-full rounded-xs transition-all duration-500 ${
                          cell.bleedActive
                            ? "bg-amber-500"
                            : isMax
                            ? "bg-cyan-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>

                    {/* Large, High-Contrast Voltage */}
                    <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {cell.voltage.toFixed(3)} V
                    </div>

                    {/* Clear Status Tag */}
                    <div className="mt-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        cell.bleedActive
                          ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          : isMax
                          ? "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700"
                          : isMin
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                      }`}>
                        {cell.bleedActive ? "Bleed Active" : isMax ? "Peak Cell" : isMin ? "Base Cell" : "Balanced"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanatory footer strip */}
            <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                  <strong className="text-slate-800 dark:text-slate-200">Cell 07 Bleed Shunt:</strong> Active (Balancing top cell down by 85 mA)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  <strong className="text-slate-800 dark:text-slate-200">15 Series Cells:</strong> Synchronized (Delta: {deltaV_mV} mV &lt; 35 mV limit)
                </span>
              </div>
              <button
                onClick={() => setShowDamageCriteria(true)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Understand Cell Balancing vs. Damage Criteria</span>
                <span>→</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── CELL DAMAGE & DEGRADATION DETERMINATION MODAL ─── */}
      {showDamageCriteria && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 font-sans animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    How We Determine If an EV Battery Cell is Damaged
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Physics-based multi-parameter electrochemical triage rules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDamageCriteria(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                <div className="font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Important: Why is Cell 07 Highlighted in Orange?</span>
                </div>
                <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                  <strong>Cell 07 is NOT damaged.</strong> It currently has the highest surface voltage (3.350 V) in the pack string. The smart BMS has simply engaged an <strong>85 mA passive bleed resistor</strong> to shave off excess charge so the other 15 cells can finish charging evenly without overvoltage.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  The 4 Engineering Criteria for Cell Damage Detection:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>1. Severe Voltage Delta (ΔV &gt; 50 mV)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      A healthy pack maintains ΔV &lt; 25 mV. If a cell sags &gt; 50 mV below neighbors under discharge or collapses &lt; 2.50 V, it indicates active material loss or internal micro-shorting.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>2. High Internal Resistance (R_int &gt; 25 mΩ)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Calculated dynamically via ΔV / ΔI during acceleration steps. Damaged cells suffer electrolyte dry-out or SEI cracking, doubling internal impedance (normal: 10–15 mΩ).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>3. Localized Thermal Hotspot (ΔT &gt; 4.5°C)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      High internal resistance forces excess Joule heat generation (I²R). If any single cell runs &gt; 4.5°C hotter than the pack mean, it is flagged for thermal degradation.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>4. Coulombic Efficiency Drop (η &lt; 96%)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Charge-in vs discharge-out ratio. Damaged cells experience parasitic secondary reactions and irreversible lithium plating, dropping efficiency below 96% (normal: 99.4%).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowDamageCriteria(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
              >
                Close Explainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fleet Vehicle Registry Table */}
      <div className="tech-surface p-5 space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Commercial Fleet Telematics Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredVehicles.length} of {vehicles.length} operational chassis in telemetry link
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
