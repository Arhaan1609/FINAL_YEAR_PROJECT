/**
 * Realistic Mock Data Generator for EV Battery Intelligence Platform.
 * Supports offline demoing with realistic variance and simulated latency.
 */

import {
  HealthResponse,
  ModelPredictionResponse,
  SOCRequest,
  SOHRequest,
  RULRequest,
  MileageRequest,
  ThermalRequest,
  ThermalResponse,
  SOHDeepRequest,
  SOHDeepResponse,
  DiagnoseRequest,
  DiagnoseResponse,
  DriverBehaviorRequest,
  DriverBehaviorResponse,
  KneePredictionRequest,
  KneePredictionResponse,
  MetaEnsembleRequest,
  MetaEnsembleResponse,
  FleetVehicle,
} from "./types";

import rawFleetData from "../../public/data/fleet_vehicles.json";

export const MOCK_VEHICLES: FleetVehicle[] = (rawFleetData as FleetVehicle[]) || [];

// Dynamic Custom Vehicle Resolver for any search query
export function getOrCreateCustomVehicle(chassisQuery: string): FleetVehicle {
  const cleanId = chassisQuery.trim().toUpperCase();
  const existing = MOCK_VEHICLES.find(
    (v) => v.id.toUpperCase() === cleanId || v.id.includes(cleanId)
  );
  if (existing) return existing;

  // On-demand provision a new digital twin for any custom chassis!
  const customVehicle: FleetVehicle = {
    id: cleanId,
    chassis: cleanId,
    model: "Enterprise Commercial EV (Euler / Tata Custom Pack)",
    fleet: "National Dynamic Fleet Registry",
    driver: `Unit ${cleanId}`,
    soc: 78.5,
    soh: 92.4,
    rul: 1050,
    mileage: 104.0,
    battery_temp: 32.5,
    controller_temp: 40.0,
    motor_temp: 52.0,
    voltage: 75.2,
    current: -19.5,
    speed: 35.0,
    charge_cycle_count: 240,
    status: "active",
    lastPing: "Just now (Live Query)",
  };

  MOCK_VEHICLES.unshift(customVehicle);
  return customVehicle;
}

// Helper: random jitter
function jitter(base: number, percent: number = 2): number {
  const delta = base * (percent / 100) * (Math.random() * 2 - 1);
  return Number((base + delta).toFixed(2));
}

// 1. Health
export function getMockHealth(): HealthResponse {
  return {
    status: "ok",
    module_a_models: { SOC: true, SOH: true, RUL: true, Mileage: true },
    module_b_engine: true,
    module_c_engine: true,
    message: "EV Battery Intelligence API Operational (Mock Mode)",
  };
}

// 2. Module A — SOC
export function getMockSOC(req: SOCRequest): ModelPredictionResponse {
  // Approximate open-circuit voltage model
  let est = ((req.battery_voltage - 64.0) / (82.0 - 64.0)) * 100;
  est = Math.max(5, Math.min(100, est));
  return {
    task: "SOC",
    model_used: "KNN (K-Nearest Neighbors)",
    prediction: jitter(est, 1.5),
    unit: "%",
  };
}

// 3. Module A — SOH Tabular
export function getMockSOH(req: SOHRequest): ModelPredictionResponse {
  const odo = req.odometer || 0;
  const cycle = req.charge_cycle_count || (odo > 0 ? odo / 58 : 200);
  const tempPenalty = Math.max(0, ((req.battery_temp || 32) - 32) * 0.32);
  const fade = (cycle * 0.026) + tempPenalty;
  const est = Math.max(45, Math.min(100, 100 - fade));
  return {
    task: "SOH",
    model_used: "XGBoost Regressor",
    prediction: Number(est.toFixed(2)),
    unit: "%",
  };
}

// 4. Module A — RUL
export function getMockRUL(req: RULRequest): ModelPredictionResponse {
  const odo = req.odometer || 0;
  const cycle = odo > 0 ? odo / 58 : 150;
  const remaining = Math.max(0, Math.min(1400, Math.round(1400 - (cycle * 1.15))));
  return {
    task: "RUL",
    model_used: "Gradient Boosting",
    prediction: remaining,
    unit: "cycles",
  };
}

// 5. Module A — Mileage
export function getMockMileage(req: MileageRequest): ModelPredictionResponse {
  const baseRange = 110;
  const speedPenalty = (req.avg_speed / 50) * 12;
  const est = Math.max(40, baseRange - speedPenalty);
  return {
    task: "Mileage",
    model_used: "XGBoost Regressor",
    prediction: jitter(est, 2),
    unit: "km",
  };
}

// 6. Module B — Thermal Safety
export function getMockThermal(req: ThermalRequest): ThermalResponse {
  const maxTemp = Math.max(req.vbt, req.vct, req.vmt);
  
  if (req.vmt > 75 || req.vbt > 50) {
    return {
      safety_status: "CRITICAL MOTOR OVERHEAT",
      risk_probability: 0.89,
      severity: "CRITICAL",
      active_alert: `High thermal hazard: Motor at ${req.vmt}°C exceeds safety threshold of 75°C.`,
      recommended_action: "Trigger immediate power derating (50% max current) and initiate coolant purge.",
    };
  } else if (req.vbt > 42 || req.vct > 55 || req.vmt > 65) {
    return {
      safety_status: "WARNING",
      risk_probability: 0.42,
      severity: "WARNING",
      active_alert: `Elevated thermal zone: Battery at ${req.vbt}°C approaching maximum operating tolerance.`,
      recommended_action: "Engage auxiliary cooling fans and advise driver to avoid heavy acceleration.",
    };
  } else {
    return {
      safety_status: "SAFE",
      risk_probability: 0.04,
      severity: "NORMAL",
      active_alert: "All 3 thermal zones (Battery, Inverter, Motor) within optimal parameters.",
      recommended_action: "Standard operation; thermal equilibrium maintained.",
    };
  }
}

// 7. Module B — SOH Deep (PyTorch CNN-LSTM)
export function getMockSOHDeep(req: SOHDeepRequest): SOHDeepResponse {
  const soh = jitter(92.4, 1.2);
  return {
    vehicle_id: req.vehicle_id || "GJ05CV6564",
    estimated_soh_percent: soh,
    capacity_state: "Optimal (Tier 1)",
    confidence_interval: { ci_95_lower: soh - 1.04, ci_95_upper: soh + 1.04 },
    degradation_slope_per_100_cycles: 0.51,
    model_architecture: "Hybrid 1D-CNN + LSTM",
    verified_benchmark_rmse: 5.29,
  };
}

// 8. Module B — Full Vehicle Diagnosis
export function getMockDiagnose(req: DiagnoseRequest): DiagnoseResponse {
  const thermal = getMockThermal({
    vbt: req.battery_temp,
    vct: req.controller_temp,
    vmt: req.motor_temp,
    vbv: req.voltage,
    vbc: req.current,
    soc: req.soc,
    speed: req.speed,
  });

  const isCritical = thermal.severity === "CRITICAL";
  const baseScore = isCritical ? 62 : thermal.severity === "WARNING" ? 78 : 94.5;

  return {
    vehicle_id: req.vehicle_id,
    overall_health_score: jitter(baseScore, 2),
    thermal_status: {
      safety_status: thermal.safety_status,
      risk_probability: thermal.risk_probability,
      severity: thermal.severity,
    },
    soh_status: {
      estimated_soh_percent: jitter(93.8, 1),
      capacity_state: isCritical ? "Degraded (Tier 3)" : "Optimal (Tier 1)",
    },
    critical_alert: isCritical,
    action_items: isCritical
      ? [
          "Immediate inspection of cooling circuit recommended.",
          "Limit discharge current to prevent accelerated thermal degradation.",
        ]
      : [
          "Battery pack operating at nominal thermal equilibrium.",
          "Cell balance acceptable across sub-modules.",
        ],
  };
}

// 9. Module C — Driver Behavior (Calibrated for commercial Euler HiLoad 12.4 kWh LFP)
export function getMockDriverBehavior(req: DriverBehaviorRequest): DriverBehaviorResponse {
  const normAccel = Math.min(1.0, (req.harsh_accel_count || 0) / 10.0);
  const normBrake = Math.min(1.0, (req.harsh_brake_count || 0) / 10.0);
  const normCorner = Math.min(1.0, (req.harsh_corner_count || 0) / 8.0);
  const normSpeedVar = Math.min(1.0, (req.speed_variance || 5.0) / 25.0);
  const avgSpd = req.avg_speed || 34.0;
  const normKinetic = Math.min(1.0, Math.pow(avgSpd / 70.0, 2));
  const normOverspeed = Math.min(1.0, (req.overspeed_count || 0) / 5.0);

  const rawAi =
    0.25 * normAccel +
    0.20 * normBrake +
    0.15 * normCorner +
    0.15 * normSpeedVar +
    0.15 * normKinetic +
    0.10 * normOverspeed;
  const ai = Number(Math.max(0.0, Math.min(1.0, rawAi)).toFixed(4));

  const maxCurrent = Math.abs(req.max_discharge_current || 25.0);
  const maxTemp = req.battery_temp_max || 34.0;

  const tempStrain = Math.max(0.0, Math.min(1.0, (maxTemp - 30.0) / 22.0));
  const currentStrain = Math.min(1.0, Math.max(0.0, (maxCurrent - 15.0) / 115.0));
  const voltageVar = 0.4 + 2.2 * Math.pow(Math.min(1.0, maxCurrent / 120.0), 2) * (1.0 + normSpeedVar * 0.4);
  const voltageStrain = Math.min(1.0, voltageVar / 4.5);
  const socDrain = 0.42 + 0.38 * Math.min(1.0, maxCurrent / 100.0) + 0.20 * normAccel;
  const drainStrain = Math.min(1.0, socDrain / 1.4);

  const rawBsi =
    0.35 * tempStrain +
    0.30 * currentStrain +
    0.20 * voltageStrain +
    0.15 * drainStrain;
  const bsi = Number(Math.max(0.0, Math.min(1.0, rawBsi)).toFixed(4));

  const rawPenalty = 3.2 * Math.pow(ai, 1.35) + 1.8 * Math.pow(bsi, 1.5) - 0.22;
  const penalty = Math.max(0.0, Math.min(5.0, Number(rawPenalty.toFixed(2))));
  const finalPenalty = penalty < 0.05 ? 0.0 : penalty;

  let classification = "Smooth & Energy-Conscious";
  let sohImpact = "Optimal eco-driving: Minimal dynamic stress preserves active material (+3.5-4.5% lifetime retention).";

  if (ai > 0.65) {
    classification = "Aggressive / High Stress";
    sohImpact = `Aggressive driving: High C-rate surges accelerate SEI growth, inducing ~${finalPenalty.toFixed(1)}%/yr excess fade.`;
  } else if (ai > 0.35) {
    classification = "Moderate Fleet Standard";
    sohImpact = `Nominal fleet duty: Standard dynamic stress adds manageable ~${finalPenalty.toFixed(1)}%/yr excess capacity fade.`;
  }

  const directive =
    bsi >= 0.65
      ? "CRITICAL STRAIN: High C-rate discharge and thermal accumulation detected. BMS active power throttling (derating by 15-20%) advised to prevent accelerated SEI growth."
      : bsi >= 0.38
      ? "ELEVATED STRAIN: Dynamic cell polarization observed during throttle transients. Recommend moderating high-current burst durations."
      : "NORMAL: Battery operates within optimal thermodynamic and electrical limits (C-rate < 0.35C, delta-T < 4°C).";

  const recommendations = [directive, sohImpact];
  if ((req.harsh_accel_count || 0) >= 3) {
    recommendations.push(`Throttle Tip-In: High frequency of sudden accelerations (${req.harsh_accel_count}/trip). Soften initial pedal ramp to reduce I²R Joule heating.`);
  }
  if ((req.harsh_brake_count || 0) >= 3) {
    recommendations.push(`Regen Braking: Aggressive braking spikes (${req.harsh_brake_count}/trip). Distribute deceleration over longer distances to protect graphite anode.`);
  }
  if (maxCurrent >= 75) {
    recommendations.push(`Current Draw: Peak discharge reached ${maxCurrent.toFixed(0)} A (>0.45C). Recommend software torque capping during heavy payload climbs.`);
  }
  if ((req.speed_variance || 0) >= 12.0) {
    recommendations.push(`Speed Uniformity: Elevated speed variance (${req.speed_variance.toFixed(1)} km/h) indicates erratic navigation. Maintain steady cruise speeds.`);
  }

  return {
    aggressiveness_index: ai,
    battery_stress_index: bsi,
    driver_classification: classification,
    annual_soh_penalty_percent: finalPenalty,
    estimated_annual_soh_penalty_pct: finalPenalty,
    behavioral_impact_description: sohImpact,
    bms_recommended_directive: directive,
    recommendations,
  };
}

// 10. Module C — Knee Point
export function getMockKneePoint(req: KneePredictionRequest): KneePredictionResponse {
  const cycle = req.charge_cycle_count || 200;
  const estimatedKneeCycle = 950;
  const remaining = Math.max(0, estimatedKneeCycle - cycle);
  const isPost = cycle >= estimatedKneeCycle;

  return {
    rul_to_knee_cycles: jitter(remaining, 3),
    is_post_knee: isPost,
    knee_risk_state: isPost
      ? "Post-Knee Accelerated Degradation"
      : remaining < 200
      ? "Approaching Knee Onset (<200 cycles)"
      : "Pre-Knee Safe Degradation Regime",
    aging_rate_slope: isPost ? -0.058 : -0.016,
    bms_directive: isPost
      ? "Apply conservative charging limits (0.5C max). Inspect pack for cell capacity divergence."
      : "Standard CC-CV fast charging permitted.",
  };
}

// 11. Module C — Meta-Ensemble
export function getMockMetaEnsemble(req: MetaEnsembleRequest): MetaEnsembleResponse {
  const knee = getMockKneePoint({
    charge_cycle_count: req.charge_cycle_count,
    capacity: 94.0,
    voltage: req.battery_voltage,
    battery_temp: req.battery_temp,
    current: req.battery_current,
    soc: req.soc,
    speed: 35.0,
  });

  const behavior = getMockDriverBehavior({
    harsh_accel_count: req.harsh_accel_count,
    harsh_brake_count: 2,
    harsh_corner_count: 1,
    speed_variance: req.speed_variance,
    avg_speed: 36.0,
    max_speed: 65.0,
    battery_temp_max: req.battery_temp + 3,
    max_discharge_current: 35.0,
  });

  const estimatedSoh = jitter(94.5, 1);
  const healthStatus: "Optimal" | "Nominal" | "Warning" | "Critical" =
    estimatedSoh >= 90 && knee.rul_to_knee_cycles > 300
      ? "Optimal"
      : estimatedSoh >= 82 && knee.rul_to_knee_cycles > 100
      ? "Nominal"
      : estimatedSoh >= 75 || knee.rul_to_knee_cycles > 0
      ? "Warning"
      : "Critical";

  const grade =
    healthStatus === "Optimal"
      ? "Grade A (Optimal)"
      : healthStatus === "Nominal"
      ? "Grade B (Nominal Fleet Standard)"
      : healthStatus === "Warning"
      ? "Grade C (Knee Proximity / High Wear)"
      : "Grade D (Post-Knee Accelerated Degradation)";

  return {
    vehicle_id: req.vehicle_id,
    estimated_soh: estimatedSoh,
    rul_to_knee_cycles: knee.rul_to_knee_cycles,
    driver_aggressiveness_index: behavior.aggressiveness_index,
    battery_stress_index: behavior.battery_stress_index,
    health_status: healthStatus,
    unified_health_grade: grade,
    executive_summary: `Vehicle ${req.vehicle_id} operating in ${knee.knee_risk_state}. Driver classified as ${behavior.driver_classification} with ${knee.rul_to_knee_cycles} cycles remaining to degradation knee.`,
  };
}
