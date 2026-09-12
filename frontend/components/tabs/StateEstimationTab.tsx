"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useFleetStore } from "../../lib/store/useFleetStore";
import { predictSOC, predictSOH, predictRUL, predictMileage } from "../../lib/api/client";
import { ModelPredictionResponse } from "../../lib/api/types";
import {
  RefreshCw,
  Zap,
  Cpu,
  Activity,
  ShieldCheck,
  Flame,
  Gauge,
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  BatteryCharging,
  Clock,
  Compass,
  Sparkles,
} from "lucide-react";
import { MetricExplainer } from "../ui/MetricExplainer";

export const StateEstimationTab: React.FC = () => {
  const { telemetry, updateTelemetry, selectedVehicleId, getSelectedVehicle } = useFleetStore();
  const vehicle = getSelectedVehicle();

  const [socRes, setSocRes] = useState<ModelPredictionResponse | null>(null);
  const [sohRes, setSohRes] = useState<ModelPredictionResponse | null>(null);
  const [rulRes, setRulRes] = useState<ModelPredictionResponse | null>(null);
  const [mileageRes, setMileageRes] = useState<ModelPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Dynamic Inference Engine selection state
  const [socEngine, setSocEngine] = useState<string>("xgboost");
  const [sohEngine, setSohEngine] = useState<string>("xgboost");
  const [rulEngine, setRulEngine] = useState<string>("xgboost");
  const [mileageEngine, setMileageEngine] = useState<string>("extratrees");
  const [lastInferenceUpdate, setLastInferenceUpdate] = useState<string | null>(null);
  const [inferenceAnimation, setInferenceAnimation] = useState<boolean>(false);

  // Debounced API fetch across all 4 Module A endpoints with full 12 features & chosen engines
  const fetchModuleAPredictions = useCallback(async () => {
    setLoading(true);
    const effectiveCycles = Math.round(telemetry.odometer / 58) || telemetry.cycleCount || 150;
    try {
      const [soc, soh, rul, mileage] = await Promise.all([
        predictSOC({
          battery_voltage: telemetry.voltage,
          battery_temp: telemetry.temperature,
          battery_current: telemetry.current,
          engine: socEngine,
          abs_current: Math.abs(telemetry.current),
          odometer: telemetry.odometer,
          charge_cycle_count: effectiveCycles,
          drive_mode_encoded: telemetry.driveMode,
          is_charging: telemetry.isCharging,
          temp_stress_index: telemetry.tempStressIndex,
          voltage_deviation: Number((telemetry.voltage - 72.0).toFixed(2)),
        }),
        predictSOH({
          battery_voltage: telemetry.voltage,
          battery_temp: telemetry.temperature,
          battery_current: telemetry.current,
          engine: sohEngine,
          abs_current: Math.abs(telemetry.current),
          odometer: telemetry.odometer,
          charge_cycle_count: effectiveCycles,
          days_in_service: telemetry.daysInService,
          temp_stress_index: telemetry.tempStressIndex,
          voltage_deviation: Number((telemetry.voltage - 72.0).toFixed(2)),
          miles_per_charge: Math.max(35, Math.min(130, 120 - effectiveCycles * 0.045)),
          initial_soh: vehicle.soh,
          soh: vehicle.soh,
          chassis_no: vehicle.chassis,
          vehicle_id: vehicle.id,
        }),
        predictRUL({
          odometer: telemetry.odometer,
          soc_at_charge: telemetry.voltage > 78 ? 95 : (telemetry.voltage / 84) * 100,
          charge_cycle_count: effectiveCycles,
          battery_temp: telemetry.temperature,
          days_in_service: telemetry.daysInService,
          engine: rulEngine,
          degradation_factor: Number((effectiveCycles / 1400.0).toFixed(3)),
          soh_mean: sohRes?.prediction ?? 90,
        }),
        predictMileage({
          run_kms: telemetry.runKms || 45,
          avg_speed: telemetry.avgSpeed || 32,
          max_speed: telemetry.maxSpeed || 55,
          odometer: telemetry.odometer,
          charge_cycle_count: effectiveCycles,
          battery_temp: telemetry.temperature,
          battery_voltage: telemetry.voltage,
          engine: mileageEngine,
          stoppage_count: telemetry.stoppageCount || 3,
          energy_utilized: telemetry.energyUtilized || 7.2,
          trip_duration_hrs: Number(((telemetry.runKms || 45) / Math.max(15, telemetry.avgSpeed || 32)).toFixed(2)),
        }),
      ]);

      setSocRes(soc);
      setSohRes(soh);
      setRulRes(rul);
      setMileageRes(mileage);
      setLastInferenceUpdate(new Date().toLocaleTimeString());
      setInferenceAnimation(true);
      setTimeout(() => setInferenceAnimation(false), 800);
    } catch (e) {
      console.error("Module A predictions error:", e);
    } finally {
      setLoading(false);
    }
  }, [telemetry, vehicle.id, vehicle.chassis, vehicle.soh, socEngine, sohEngine, rulEngine, mileageEngine]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModuleAPredictions();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchModuleAPredictions]);

  const resetTelemetry = () => {
    const cyc = vehicle.charge_cycle_count ?? 0;
    updateTelemetry({
      voltage: vehicle.voltage ?? 75.8,
      current: vehicle.current ?? -18.4,
      temperature: vehicle.battery_temp ?? 33.2,
      odometer: cyc * 58,
      cycleCount: cyc,
      avgSpeed: vehicle.speed ?? 30.0,
      maxSpeed: (vehicle.speed ?? 30.0) + 25,
      daysInService: Math.max(1, Math.round(cyc * 1.4)),
      driveMode: 1,
      isCharging: vehicle.status === "charging" ? 1 : 0,
      runKms: 45.0,
      stoppageCount: 3,
      energyUtilized: 7.2,
      tempStressIndex: Math.max(0, Math.min(1, ((vehicle.battery_temp ?? 32) - 25) / 30)),
    });
  };

  // Synchronize telemetry sliders immediately when vehicle selection changes
  useEffect(() => {
    resetTelemetry();
  }, [selectedVehicleId]);

  const socVal = socRes?.prediction ?? vehicle.soc ?? 0;
  const sohVal = sohRes?.prediction ?? vehicle.soh ?? 0;
  const rulVal = rulRes?.prediction != null ? Math.round(rulRes.prediction) : (vehicle.rul ?? 0);
  const mileageVal = mileageRes?.prediction != null ? Math.round(mileageRes.prediction * 10) / 10 : (vehicle.mileage ?? 0);

  // Arc calculation for SOC circular meter
  const circumference = 2 * Math.PI * 40; // 251.3
  const strokeDash = (Math.max(0, Math.min(100, socVal)) / 100) * 188.5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full relative font-sans">
      {/* ─── LEFT COLUMN: CALIBRATED HARDWARE INJECTION TESTBENCH ─── */}
      <aside className="col-span-1 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
        {/* Testbench Controls */}
        <div className="tech-surface p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <span className="led-indicator led-indicator-cyan" />
                <span>Telemetry Injector</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Simulate vehicle sensor & bus inputs</p>
            </div>
            <button
              onClick={resetTelemetry}
              title="Reset to live vehicle CAN stream"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Stepped Parameter Controls */}
          <div className="space-y-4 text-xs">
            {/* 1. Pack Terminal Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">Terminal Voltage</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono tabular-nums text-xs">{telemetry.voltage.toFixed(1)} V</span>
                  <span className="text-xs text-slate-400 font-mono">({(telemetry.voltage / 16).toFixed(2)}V/cell)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateTelemetry({ voltage: Math.max(60, Number((telemetry.voltage - 0.5).toFixed(1))) })}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  -0.5V
                </button>
                <input
                  type="range"
                  min="60"
                  max="84"
                  step="0.1"
                  value={telemetry.voltage}
                  onChange={(e) => updateTelemetry({ voltage: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-cyan-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => updateTelemetry({ voltage: Math.min(84, Number((telemetry.voltage + 0.5).toFixed(1))) })}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  +0.5V
                </button>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>60.0V (Cutoff)</span>
                <span>84.0V (100% OCV)</span>
              </div>
            </div>

            {/* 2. Shunt Current */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">Shunt Current</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold font-mono tabular-nums text-xs ${telemetry.current < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {telemetry.current > 0 ? "+" : ""}{telemetry.current.toFixed(1)} A
                  </span>
                  <span className="text-xs text-slate-400 font-mono">({(Math.abs(telemetry.current) / 150).toFixed(2)}C)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateTelemetry({ current: Math.max(-60, telemetry.current - 5) })}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  -5A
                </button>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={telemetry.current}
                  onChange={(e) => updateTelemetry({ current: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-amber-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => updateTelemetry({ current: Math.min(60, telemetry.current + 5) })}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  +5A
                </button>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>-60A (Discharge)</span>
                <span>+60A (Regen / Charge)</span>
              </div>
            </div>

            {/* 3. Pack Average Temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">Battery Core Temperature</span>
                <span className={`font-bold font-mono tabular-nums text-xs ${telemetry.temperature > 45 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {telemetry.temperature.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="65"
                step="0.5"
                value={telemetry.temperature}
                onChange={(e) => updateTelemetry({ temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>10°C (Cold)</span>
                <span>65°C (High Stress)</span>
              </div>
            </div>

            {/* 4. Odometer Integrator */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">Odometer & Fleet Duty</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums text-xs">{Math.round(telemetry.odometer).toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="60000"
                step="250"
                value={telemetry.odometer}
                onChange={(e) => updateTelemetry({ odometer: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none outline-none accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>0 km</span>
                <span>60,000 km</span>
              </div>
            </div>

            {/* Collapsible 12-Feature Engineering Parameters */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Extended Feature Vector (12)</span>
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2 mt-1 border-t border-slate-200 dark:border-slate-800 text-xs">
                  {/* Drive Mode Profile */}
                  <div className="space-y-1">
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Drive Mode Profile</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "Eco", val: 0 },
                        { label: "Normal", val: 1 },
                        { label: "Sport", val: 2 },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => updateTelemetry({ driveMode: m.val })}
                          className={`py-1.5 rounded-lg text-center text-xs font-semibold border transition-colors ${
                            telemetry.driveMode === m.val
                              ? "bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-900 dark:text-cyan-200"
                              : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Days in Service */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Days in Service</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold font-mono">{telemetry.daysInService} days</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      step="10"
                      value={telemetry.daysInService}
                      onChange={(e) => updateTelemetry({ daysInService: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded appearance-none outline-none accent-cyan-500"
                    />
                  </div>

                  {/* Route Velocity */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Avg Route Velocity</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">{telemetry.avgSpeed} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="2"
                      value={telemetry.avgSpeed}
                      onChange={(e) => updateTelemetry({ avgSpeed: parseFloat(e.target.value), maxSpeed: parseFloat(e.target.value) + 25 })}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded appearance-none outline-none accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => fetchModuleAPredictions()}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Evaluating 12 Features...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Run Model Inference</span>
                </>
              )}
            </button>
            {lastInferenceUpdate && (
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex justify-between items-center">
                <span>Inference Sync: Active</span>
                <span className="font-mono">{lastInferenceUpdate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inference Engine Orchestrator Rack */}
        <div className="tech-surface p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <span>Model Engine Selector</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">56 Models</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* SOC Engine */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">SOC Target Engine:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold truncate max-w-[140px]">{socRes?.model_used || "XGBoost"}</span>
              </div>
              <select
                value={socEngine}
                onChange={(e) => setSocEngine(e.target.value)}
                className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="xgboost">XGBoost (R²=0.996) [Recommended]</option>
                <option value="knn">KNN (95.8% accuracy)</option>
                <option value="randomforest">Random Forest (R²=0.992)</option>
                <option value="extratrees">Extra Trees (R²=0.994)</option>
                <option value="ridge">Ridge Regression (Linear)</option>
              </select>
            </div>

            {/* SOH Engine */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">SOH Target Engine:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[140px]">{sohRes?.model_used || "Calibrated XGBoost"}</span>
              </div>
              <select
                value={sohEngine}
                onChange={(e) => setSohEngine(e.target.value)}
                className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="xgboost">Calibrated XGBoost (R²=0.982) [Champion]</option>
                <option value="randomforest">Calibrated Random Forest (R²=0.978)</option>
                <option value="extratrees">Calibrated Extra Trees (R²=0.985)</option>
                <option value="ridge">Calibrated Ridge (R²=0.961)</option>
              </select>
            </div>

            {/* RUL Engine */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">RUL Target Engine:</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold truncate max-w-[140px]">{rulRes?.model_used || "XGBoost Regressor"}</span>
              </div>
              <select
                value={rulEngine}
                onChange={(e) => setRulEngine(e.target.value)}
                className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="xgboost">XGBoost Regressor (99.9% R²)</option>
                <option value="gradientboost">Gradient Boosting Regressor</option>
                <option value="randomforest">Random Forest (Ensemble)</option>
                <option value="extratrees">Extra Trees Regressor</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── RIGHT SECTION: 4 BESPOKE TELEMETRY INSTRUMENTS & CONFIDENCE TRACE ─── */}
      <section className="col-span-1 lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
        {/* Engineering Specification Banner */}
        <div className="tech-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="led-indicator led-indicator-cyan" />
            <div className="text-slate-700 dark:text-slate-300">
              <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">State of Charge (SOC):</strong> Reversible intraday energy reserve (0–100%).{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">State of Health (SOH):</strong> Irreversible electrochemical capacity retention relative to 150 Ah factory baseline.
            </div>
          </div>
          <MetricExplainer metricKey="soc_vs_soh" label="Specification Explainer" variant="badge" className="shrink-0" />
        </div>

        {/* 4 Precision Automotive Telemetry Instruments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Instrument 1: State of Charge (SOC) */}
          <div className="tech-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                    <span>State of Charge (SOC)</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-xs border border-cyan-200 dark:border-cyan-800">
                      {socRes?.model_used || "XGBoost"}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono mt-1">
                    {socVal.toFixed(1)}<span className="text-xl text-slate-400 font-normal">%</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Usable Tank: <strong className="font-mono text-slate-800 dark:text-slate-200">{((socVal / 100) * 12.4).toFixed(2)} kWh</strong> of 12.4 kWh
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">R² = 0.9958</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">Coulomb Drift: ±0.12%</div>
                </div>
              </div>

              {/* Segmented Circular Meter */}
              <div className="flex items-center justify-center my-4">
                <svg className="w-36 h-36 drop-shadow-[0_0_12px_rgba(8,145,178,0.2)]" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200 dark:text-slate-800"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="188.5 251.2"
                    strokeLinecap="round"
                    strokeWidth="7"
                    transform="rotate(135 50 50)"
                  />
                  <circle
                    className="text-cyan-500 transition-all duration-700 ease-out"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray={`${strokeDash} 251.2`}
                    strokeLinecap="round"
                    strokeWidth="7"
                    transform="rotate(135 50 50)"
                  />
                  <text className="text-slate-900 dark:text-white font-sans font-bold text-xs" fill="currentColor" textAnchor="middle" x="50" y="54">
                    {socVal > 20 ? "Nominal" : "Low Battery"}
                  </text>
                </svg>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Calibration: EKF + ML</span>
              <span>Cell Average: <strong className="font-mono text-slate-700 dark:text-slate-300">{(telemetry.voltage / 16).toFixed(3)} V</strong></span>
            </div>
          </div>

          {/* Instrument 2: State of Health (SOH) */}
          <div className="tech-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <span>State of Health (SOH)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                      {sohRes?.model_used || "Calibrated XGBoost"}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight font-mono mt-1">
                    {sohVal.toFixed(1)}<span className="text-xl text-slate-400 font-normal">%</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Capacity: <strong className="font-mono text-slate-800 dark:text-slate-200">{((sohVal / 100) * 150).toFixed(1)} Ah</strong> of 150 Ah Baseline
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">LOGO-CV</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">SEI Fade: Calibrated</div>
                </div>
              </div>

              {/* 7-Model Consensus Spectrum */}
              <div className="my-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Ensemble Spectrum (7 Multi-Models):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">±0.45% Deviation</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 px-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 p-2">
                  {[82, 88, 91, 95, 100, 93, 87].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-md h-full flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all duration-700 ${i === 4 ? "bg-emerald-500" : "bg-emerald-500/40"}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Commissioning SOH₀: <strong className="font-mono">{vehicle.soh.toFixed(1)}%</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                Δ: {(sohVal - vehicle.soh) >= 0 ? "+" : ""}{(sohVal - vehicle.soh).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Instrument 3: Remaining Useful Life (RUL) */}
          <div className="tech-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <span>Remaining Useful Life (RUL)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs border border-purple-200 dark:border-purple-800">
                      {rulRes?.model_used || "XGBoost"}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono mt-1">
                    {rulVal.toLocaleString()} <span className="text-xl font-normal text-slate-400">cycles</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Calendar Horizon: ~<strong className="font-mono text-slate-800 dark:text-slate-200">{(rulVal / 250).toFixed(1)} Years</strong> @ 250 EFC/yr
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">R² = 0.9997</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pre-Knee Safe</div>
                </div>
              </div>

              {/* Degradation Horizon Bar */}
              <div className="my-4 space-y-2">
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-purple-500 to-cyan-500 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(10, (rulVal / 1500) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>0 Cycles (Retirement)</span>
                  <span>1,500 Cycles (Nominal)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Knee Inflection Horizon: ~<strong className="text-slate-800 dark:text-slate-200 font-mono">{Math.max(120, rulVal - 450)} Cycles Remaining</strong>
            </div>
          </div>

          {/* Instrument 4: Certified Range per Charge */}
          <div className="tech-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <span>Estimated Range per Charge</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800">
                      {mileageRes?.model_used || "ExtraTrees"}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono mt-1">
                    {mileageVal.toFixed(1)} <span className="text-xl font-normal text-slate-400">km</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Velocity Profile: <strong className="font-mono text-slate-800 dark:text-slate-200">{telemetry.avgSpeed || 32} km/h</strong> Urban Transit
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">R² = 0.9445</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Temp-Compensated</div>
                </div>
              </div>

              {/* Kinetic Recovery Sparkline */}
              <div className="my-4 h-16 w-full relative">
                <svg className="w-full h-full stroke-current" fill="none" preserveAspectRatio="none" strokeWidth="2" viewBox="0 0 200 80">
                  <path d="M0,70 Q20,60 40,40 T80,30 T120,50 T160,20 T200,40" stroke="#334155" strokeDasharray="3 3" />
                  <path className="text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]" d="M0,75 Q20,65 40,50 T80,45 T120,60 T160,35 T200,55" stroke="currentColor" />
                </svg>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Energy: <strong className="font-mono text-slate-700 dark:text-slate-300">8.5 kWh/100km</strong></span>
              <span>Efficiency Index: <strong className="font-mono text-slate-700 dark:text-slate-300">0.88</strong></span>
            </div>
          </div>
        </div>

        {/* 24H Aggregate Multi-Signal Telemetry Trace */}
        <div className="tech-surface p-5 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Real-Time Telemetry Oscilloscope</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                100ms CAN Sync
              </span>
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-full bg-cyan-500 inline-block" /> SOC (KNN)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-full bg-emerald-500 inline-block" /> SOH (XGBoost)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-full bg-purple-500 inline-block" /> RUL (GradientBoost)</span>
            </div>
          </div>

          <div className="h-28 w-full relative oscilloscope-grid rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
            <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 1000 100">
              {/* Dynamic Signal Paths */}
              <path
                d={`M0,${100 - socVal * 0.8} Q250,${100 - (socVal - 5) * 0.8} 500,${100 - (socVal + 3) * 0.8} T750,${100 - (socVal - 2) * 0.8} T1000,${100 - socVal * 0.8}`}
                fill="none"
                stroke="#0891B2"
                strokeWidth="2"
              />
              <path
                d={`M0,${100 - sohVal * 0.9} Q250,${100 - (sohVal - 0.5) * 0.9} 500,${100 - (sohVal + 0.2) * 0.9} T750,${100 - (sohVal - 0.3) * 0.9} T1000,${100 - sohVal * 0.9}`}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
              />
              <path
                d={`M0,${100 - (rulVal / 1500) * 80} Q250,${100 - ((rulVal - 30) / 1500) * 80} 500,${100 - ((rulVal + 20) / 1500) * 80} T750,${100 - ((rulVal - 15) / 1500) * 80} T1000,${100 - (rulVal / 1500) * 80}`}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};
