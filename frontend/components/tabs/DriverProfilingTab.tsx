"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useFleetStore } from "../../lib/store/useFleetStore";
import { predictDriverBehavior } from "../../lib/api/client";
import { DriverBehaviorResponse } from "../../lib/api/types";
import {
  Gauge,
  Zap,
  TrendingDown,
  UserCheck,
  Activity,
  ShieldAlert,
  Sliders,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { MetricExplainer } from "../ui/MetricExplainer";

export const DriverProfilingTab: React.FC = () => {
  const { telemetry, selectedVehicleId, getSelectedVehicle } = useFleetStore();
  const vehicle = getSelectedVehicle();

  const [harshAccel, setHarshAccel] = useState<number>(telemetry.harshAccel || 2);
  const [harshBrake, setHarshBrake] = useState<number>(telemetry.harshBrake || 1);
  const [harshCorner, setHarshCorner] = useState<number>(telemetry.harshCorner || 1);
  const [speedVariance, setSpeedVariance] = useState<number>(7.8);
  const [maxDischarge, setMaxDischarge] = useState<number>(36.0);

  // Sync driver inputs immediately when vehicle changes
  useEffect(() => {
    const isWarn = vehicle.status === "warning";
    const isCrit = vehicle.status === "critical";
    setHarshAccel(isCrit ? 8 : isWarn ? 4 : 1);
    setHarshBrake(isCrit ? 6 : isWarn ? 3 : 1);
    setHarshCorner(isCrit ? 3 : isWarn ? 2 : 1);
    setSpeedVariance(isCrit ? 21.0 : isWarn ? 12.0 : 5.0);
    setMaxDischarge(isCrit ? 110.0 : isWarn ? 55.0 : 25.0);
  }, [selectedVehicleId, vehicle]);

  const [behaviorData, setBehaviorData] = useState<DriverBehaviorResponse | any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const evaluateBehavior = useCallback(async () => {
    setLoading(true);
    try {
      const res = await predictDriverBehavior({
        harsh_accel_count: harshAccel,
        harsh_brake_count: harshBrake,
        harsh_corner_count: harshCorner,
        speed_variance: speedVariance,
        avg_speed: telemetry.avgSpeed || 34,
        max_speed: telemetry.maxSpeed || 58,
        battery_temp_max: (telemetry.temperature || 32) + (maxDischarge > 75 ? 6 : 2),
        max_discharge_current: maxDischarge,
      });
      setBehaviorData(res);
    } catch (e) {
      console.error("Driver behavior error:", e);
    } finally {
      setLoading(false);
    }
  }, [harshAccel, harshBrake, harshCorner, speedVariance, telemetry, maxDischarge]);

  useEffect(() => {
    const timer = setTimeout(() => {
      evaluateBehavior();
    }, 150);
    return () => clearTimeout(timer);
  }, [evaluateBehavior]);

  const ai = behaviorData?.aggressiveness_index ?? 0.0;
  const bsi = behaviorData?.battery_stress_index ?? 0.0;
  const isAggressive = ai > 0.65;
  const isModerate = ai > 0.35 && ai <= 0.65;

  const rawPenalty =
    behaviorData?.estimated_annual_soh_penalty_pct ??
    behaviorData?.annual_soh_penalty_percent ??
    0.0;
  const annualPenalty = rawPenalty < 0.05 ? 0.0 : rawPenalty;

  // Preset selector
  const applyPreset = (type: "calm" | "moderate" | "aggressive") => {
    if (type === "calm") {
      setHarshAccel(1);
      setHarshBrake(1);
      setHarshCorner(1);
      setSpeedVariance(5.0);
      setMaxDischarge(25.0);
    } else if (type === "moderate") {
      setHarshAccel(4);
      setHarshBrake(3);
      setHarshCorner(2);
      setSpeedVariance(12.0);
      setMaxDischarge(55.0);
    } else {
      setHarshAccel(8);
      setHarshBrake(6);
      setHarshCorner(4);
      setSpeedVariance(21.0);
      setMaxDischarge(115.0);
    }
  };

  const recommendationList: string[] = Array.isArray(behaviorData?.recommendations)
    ? behaviorData.recommendations
    : [
        behaviorData?.bms_recommended_directive,
        behaviorData?.behavioral_impact_description,
      ].filter(Boolean) as string[];

  const finalRecommendations =
    recommendationList.length > 0
      ? recommendationList
      : loading
      ? [
          "Evaluating throttle dynamics and discharge transients...",
          "Computing regenerative braking energy recovery envelope...",
          "Calculating electro-thermal stress dissipation limits...",
        ]
      : ["Awaiting driver behavioral telemetry stream."];

  // Financial depreciation estimate: ₹18,000 / 1% SOH for typical commercial 12.4 kWh LFP pack
  const annualFinancialCost = Math.round(annualPenalty * 18000);

  return (
    <div className="flex flex-col w-full gap-5 font-sans">
      {/* ── MODULE HEADER & J1939 CAN EEC1 RIBBON ── */}
      <div className="tech-surface-raised p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="telemetry-tag border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-500/10">
                Module C · J1939 EEC1 Telemetry
              </span>
              <span className="telemetry-tag border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10">
                Throttle Jerk Analysis
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Driver: <strong className="text-slate-800 dark:text-slate-200">{vehicle.driver}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Behavior-Aware BMS (BA-BMS) Driver Profiling
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Driver Profile:</span>
          <span
            className={`px-3 py-1 rounded-full font-semibold border text-xs ${
              isAggressive
                ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                : isModerate
                ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {behaviorData?.driver_classification || (loading ? "Profiling..." : "Eco-Optimized")}
          </span>
        </div>
      </div>

      {/* ── HERO TELEMETRY TILES (3 INDUSTRIAL INSTRUMENTS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tile 1: Driver Aggressiveness Index (AI) */}
        <div className="tech-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b hairline-border">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aggressiveness Index (AI)
            </span>
            <MetricExplainer
              metricKey="driver_ai"
              currentValue={`AI = ${ai.toFixed(3)}`}
              label="6-Factor Model"
            />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {ai.toFixed(3)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">0.000 → 1.000 Scale</span>
          </div>

          {/* Calibrated AI Linear Meter */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  isAggressive
                    ? "bg-rose-500"
                    : isModerate
                    ? "bg-amber-500"
                    : "bg-cyan-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, ai * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0.00 (Calm)</span>
              <span>0.35 (Nominal)</span>
              <span>0.65 (High Strain)</span>
              <span>1.00</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border hairline-border text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Throttle Jerk Frequency:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {(harshAccel * 0.45 + harshBrake * 0.35).toFixed(1)} events/km
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Speed Variance (σ):</span>
              <strong className="text-purple-600 dark:text-purple-400 font-mono">
                {speedVariance.toFixed(1)} km/h
              </strong>
            </div>
          </div>
        </div>

        {/* Tile 2: Battery Stress Index (BSI) */}
        <div className="tech-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b hairline-border">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Battery Stress Index (BSI)
            </span>
            <MetricExplainer
              metricKey="driver_ai"
              currentValue={`BSI = ${bsi.toFixed(3)}`}
              label="Stress PoC"
            />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {bsi.toFixed(3)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">C-Rate & Thermal Strain</span>
          </div>

          {/* Calibrated BSI Linear Meter */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  bsi > 0.65
                    ? "bg-rose-500"
                    : bsi > 0.38
                    ? "bg-amber-500"
                    : "bg-purple-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, bsi * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0.00 (Passivated)</span>
              <span>0.40 (Nominal)</span>
              <span>0.70 (Severe Strain)</span>
              <span>1.00</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border hairline-border text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Peak Discharge Rate:</span>
              <strong className={`font-mono ${maxDischarge > 75 ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"}`}>
                {(maxDischarge / 150.0).toFixed(2)}C ({maxDischarge.toFixed(0)}A)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Micro-Cracking Factor:</span>
              <strong className={`font-semibold ${bsi > 0.5 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {bsi > 0.5 ? "2.3x Baseline" : "1.0x Baseline"}
              </strong>
            </div>
          </div>
        </div>

        {/* Tile 3: Degradation Penalty & Financial Impact */}
        <div className="tech-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b hairline-border">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Annual Degradation Surcharge
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div
              className={`text-4xl font-extrabold font-mono tracking-tight ${
                annualPenalty > 2.0
                  ? "text-rose-600 dark:text-rose-400"
                  : annualPenalty > 0.5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {annualPenalty > 0.05 ? `-${annualPenalty.toFixed(1)}%` : "0.0%"}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Excess SOH Fade / Year</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border hairline-border text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Asset Depreciation Impact:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {annualFinancialCost > 0 ? `₹${annualFinancialCost.toLocaleString("en-IN")}` : "₹0 (No Penalty)"}
              </strong>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Standard Fleet Rate: ~1.8% / yr</span>
              <span>Based on 25,000 km</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {annualPenalty > 0.05
              ? "Aggressive throttle transients accelerate solid-electrolyte interphase (SEI) micro-fracturing."
              : "Calm driving preserves cathode particle morphology and prevents local lithium plating."}
          </p>
        </div>
      </div>

      {/* ── HARDWARE INJECTION TESTBENCH & BMS GUIDANCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Driving Pattern Simulator (7 cols) */}
        <div className="lg:col-span-7 tech-surface p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b hairline-border">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Powertrain Phase-Space Simulator
              </h3>
            </div>

            {/* Quick Profile Selectors */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => applyPreset("calm")}
                className="px-2.5 py-1 rounded-lg border hairline-border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                Eco
              </button>
              <button
                onClick={() => applyPreset("moderate")}
                className="px-2.5 py-1 rounded-lg border hairline-border bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                Nominal
              </button>
              <button
                onClick={() => applyPreset("aggressive")}
                className="px-2.5 py-1 rounded-lg border hairline-border bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                Aggressive
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Harsh Acceleration */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Harsh Acceleration Events / Trip:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHarshAccel((v) => Math.max(0, v - 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    -1
                  </button>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono w-6 text-center">{harshAccel}</span>
                  <button
                    onClick={() => setHarshAccel((v) => Math.min(12, v + 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    +1
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={harshAccel}
                onChange={(e) => setHarshAccel(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-cyan-600 cursor-pointer"
              />
            </div>

            {/* Harsh Braking */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Harsh Braking Events / Trip:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHarshBrake((v) => Math.max(0, v - 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    -1
                  </button>
                  <span className="text-amber-600 dark:text-amber-400 font-bold font-mono w-6 text-center">{harshBrake}</span>
                  <button
                    onClick={() => setHarshBrake((v) => Math.min(12, v + 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    +1
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={harshBrake}
                onChange={(e) => setHarshBrake(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Harsh Cornering */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Harsh Cornering Events / Trip:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHarshCorner((v) => Math.max(0, v - 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    -1
                  </button>
                  <span className="text-purple-600 dark:text-purple-400 font-bold font-mono w-6 text-center">{harshCorner}</span>
                  <button
                    onClick={() => setHarshCorner((v) => Math.min(8, v + 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    +1
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={harshCorner}
                onChange={(e) => setHarshCorner(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Speed Variance */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Speed Standard Deviation (σ_v):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSpeedVariance((v) => Math.max(2, v - 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    -1
                  </button>
                  <span className="text-purple-600 dark:text-purple-400 font-bold font-mono w-12 text-center">
                    {speedVariance.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setSpeedVariance((v) => Math.min(25, v + 1))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    +1
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="0.5"
                value={speedVariance}
                onChange={(e) => setSpeedVariance(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Peak Discharge Current */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Peak Discharge Transient:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMaxDischarge((v) => Math.max(15, v - 10))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    -10A
                  </button>
                  <span
                    className={`font-bold font-mono w-14 text-center ${
                      maxDischarge > 75 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {maxDischarge.toFixed(0)} A
                  </span>
                  <button
                    onClick={() => setMaxDischarge((v) => Math.min(140, v + 10))}
                    className="px-2 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    +10A
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="15"
                max="140"
                step="1"
                value={maxDischarge}
                onChange={(e) => setMaxDischarge(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: BMS Guidance Directives & Telematics (5 cols) */}
        <div className="lg:col-span-5 tech-surface p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Active Driver Coaching Directives
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                Dispatch Ready
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {finalRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border hairline-border text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">[{i + 1}]</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t hairline-border text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>Speed Governor:</span>
              <strong className={isAggressive ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
                {isAggressive ? "Limit 45 km/h Active" : "Standard 65 km/h"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Regenerative Braking Clamp:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {maxDischarge > 75 ? "Restricted to 45A" : "Max 80A Authorized"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Calibration Standard:</span>
              <span>ISO 26262 Audited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfilingTab;
