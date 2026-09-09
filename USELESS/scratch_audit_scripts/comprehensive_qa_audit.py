import sys
import os
sys.path.insert(0, os.path.abspath("."))
import json
import numpy as np
from fastapi.testclient import TestClient
from api.main import app

# Load fleet vehicles
with open("frontend/public/data/fleet_vehicles.json", "r") as f:
    vehicles = json.load(f)

print(f"Total vehicles in fleet dataset: {len(vehicles)}")

# Sample diverse fleet vehicles across cycle age, SOH, and triage status
sample_vehicles = [
    # Low cycle (<100 cycles, new)
    v for v in vehicles if v["charge_cycle_count"] < 100
][:3] + [
    # Mid cycle (300-600 cycles)
    v for v in vehicles if 300 <= v["charge_cycle_count"] <= 600
][:3] + [
    # High cycle (>800 cycles, aged)
    v for v in vehicles if v["charge_cycle_count"] > 800
][:3] + [
    # Critical status
    v for v in vehicles if v.get("status") == "critical"
][:2]

print(f"Testing {len(sample_vehicles)} sample vehicles across all 10 endpoints.\n")

results = []
issues_found = []

with TestClient(app) as client:
    for v in sample_vehicles:
        vid = v["id"]
        cycles = v["charge_cycle_count"]
        soh_reg = v["soh"]
        soc_reg = v["soc"]
        temp = v["battery_temp"]
        status = v["status"]
        
        # 1. Module A: SOC
        r_soc = client.post("/predict/soc", json={
            "battery_voltage": v["voltage"],
            "battery_temp": temp,
            "battery_current": v["current"],
            "charge_cycle_count": cycles,
            "vehicle_id": vid,
            "soc": soc_reg,
            "soh": soh_reg,
            "initial_soh": soh_reg
        }).json()
        soc_pred = r_soc.get("prediction")
        
        # 2. Module A: SOH
        r_soh = client.post("/predict/soh", json={
            "battery_voltage": v["voltage"],
            "battery_temp": temp,
            "battery_current": v["current"],
            "charge_cycle_count": cycles,
            "odometer": cycles * 58.0,
            "vehicle_id": vid,
            "chassis_no": v.get("chassis", vid),
            "initial_soh": soh_reg,
            "soh": soh_reg
        }).json()
        soh_pred = r_soh.get("prediction")
        
        # 3. Module A: RUL
        r_rul = client.post("/predict/rul", json={
            "odometer": cycles * 58.0,
            "charge_cycle_count": cycles,
            "soc_at_charge": soc_reg,
            "battery_voltage": v["voltage"],
            "battery_temp": temp,
            "vehicle_id": vid,
            "initial_soh": soh_reg
        }).json()
        rul_pred = r_rul.get("prediction")
        
        # 4. Module A: Mileage
        r_mileage = client.post("/predict/mileage", json={
            "run_kms": 45.0,
            "avg_speed": v.get("speed", 32.0),
            "max_speed": v.get("speed", 32.0) + 20.0,
            "soc": soc_reg,
            "soh": soh_reg,
            "battery_voltage": v["voltage"],
            "battery_temp": temp,
            "charge_cycle_count": cycles,
            "vehicle_id": vid,
            "initial_soh": soh_reg
        }).json()
        mileage_pred = r_mileage.get("prediction")
        
        # 5. Module B: Thermal
        r_thermal = client.post("/predict/thermal", json={
            "vbt": temp,
            "vct": v.get("controller_temp", temp + 4.5),
            "vmt": v.get("motor_temp", temp + 9.0),
            "vbv": v["voltage"],
            "vbc": v["current"],
            "soc": soc_reg,
            "speed": v.get("speed", 32.0)
        }).json()
        
        # 6. Module B: Diagnose
        r_diag = client.post("/predict/diagnose/vehicle", json={
            "vehicle_id": vid,
            "voltage": v["voltage"],
            "current": v["current"],
            "battery_temp": temp,
            "controller_temp": v.get("controller_temp", temp + 4.5),
            "motor_temp": v.get("motor_temp", temp + 9.0),
            "soc": soc_reg,
            "speed": v.get("speed", 32.0),
            "odometer_km": cycles * 58.0
        }).json()
        
        # 7. Module C: Driver Behavior
        r_driver = client.post("/predict/driver-behavior", json={
            "harsh_accel_count": 5 if status == "warning" else (8 if status == "critical" else 1),
            "harsh_brake_count": 5 if status == "critical" else 1,
            "harsh_corner_count": 1,
            "speed_variance": 14.5,
            "avg_speed": v.get("speed", 32.0),
            "max_speed": v.get("speed", 32.0) + 22.0,
            "battery_temp_max": temp + 3.0,
            "max_discharge_current": abs(v["current"]) + 10.0
        }).json()
        
        # 8. Module C: Knee Point
        r_knee = client.post("/predict/knee-point", json={
            "charge_cycle_count": cycles,
            "voltage": v["voltage"],
            "battery_temp": temp,
            "current": v["current"],
            "soc": soc_reg,
            "speed": v.get("speed", 32.0),
            "run_kms": 50.0,
            "energy_kwh": 8.5
        }).json()
        
        # 9. Module C: Meta Ensemble
        r_meta = client.post("/predict/meta-ensemble", json={
            "vehicle_id": vid,
            "battery_voltage": v["voltage"],
            "battery_current": v["current"],
            "battery_temp": temp,
            "controller_temp": v.get("controller_temp", temp + 4.5),
            "motor_temp": v.get("motor_temp", temp + 9.0),
            "speed": v.get("speed", 32.0),
            "charge_cycle_count": cycles,
            "soc": soc_reg,
            "soh": soh_reg,
            "initial_soh": soh_reg,
            "harsh_accel_count": 2,
            "harsh_brake_count": 1,
            "capacity_throughput_ah": cycles * 165.0,
            "fast_charge_ratio": 0.25
        }).json()
        
        # 10. Copilot Explain
        r_explain = client.post("/copilot/explain-vehicle", json={
            "vehicle_id": vid,
            "telemetry": v,
            "predictions": {
                "soc": soc_pred if soc_pred is not None else soc_reg,
                "soh": soh_pred if soh_pred is not None else soh_reg,
                "rul": rul_pred if rul_pred is not None else 1000,
                "mileage": mileage_pred if mileage_pred is not None else 100
            },
            "force_refresh": True
        }).json()

        # PHYSICAL & ENGINEERING SENSE CHECKS
        # Check 1: SOH in realistic bounds (65% - 100%)
        if soh_pred is not None and (soh_pred < 65.0 or soh_pred > 100.5):
            issues_found.append(f"[{vid}] SOH {soh_pred}% out of physical bounds [65, 100]")
            
        # Check 2: RUL must be positive and reasonable (< 3000 cycles for LFP)
        if rul_pred is not None and (rul_pred < 0 or rul_pred > 3000):
            issues_found.append(f"[{vid}] RUL {rul_pred} cycles out of bounds [0, 3000]")
            
        # Check 3: Mileage range must be reasonable for Euler HiLoad (12.4 kWh battery: max range ~120-140 km at 100% SOC)
        if mileage_pred is not None:
            expected_max_range = 140.0 * (soc_reg / 100.0) * 1.3
            if mileage_pred > expected_max_range:
                issues_found.append(f"[{vid}] Mileage {mileage_pred} km is physically unrealistic for SOC {soc_reg}% (max plausible ~{expected_max_range:.1f} km)")

        results.append({
            "vid": vid,
            "status": status,
            "cycles": cycles,
            "soc_reg": soc_reg,
            "soc_pred": soc_pred,
            "soh_reg": soh_reg,
            "soh_pred": soh_pred,
            "rul_pred": rul_pred,
            "mileage_pred": mileage_pred,
            "thermal_safety": r_thermal.get("safety_status"),
            "thermal_risk": r_thermal.get("risk_probability"),
            "diag_score": r_diag.get("overall_health_score"),
            "diag_mode": r_diag.get("fleet_operating_mode"),
            "driver_class": r_driver.get("driver_classification"),
            "driver_agg": r_driver.get("aggressiveness_index"),
            "knee_rul": r_knee.get("rul_to_knee_cycles"),
            "knee_cycle": r_knee.get("estimated_knee_cycle"),
            "knee_state": r_knee.get("knee_risk_state"),
            "meta_soh": r_meta.get("estimated_soh"),
            "meta_rul": r_meta.get("rul_to_knee_cycles"),
            "meta_grade": r_meta.get("unified_health_grade"),
            "meta_status": r_meta.get("health_status"),
            "copilot_urgency": r_explain.get("urgency"),
        })

print(f"{'VID':<12} | {'Stat':<8} | {'Cyc':<5} | {'SOH_r':<5} | {'SOH_p':<6} | {'RUL_p':<6} | {'Mil_p':<6} | {'Thermal':<10} | {'Knee_RUL':<8} | {'MetaGrade':<16} | {'Copilot':<8}")
print("-" * 115)
for res in results:
    th = str(res['thermal_safety'])[:10] if res['thermal_safety'] else "None"
    mg = str(res['meta_grade'])[:16] if res['meta_grade'] else "None"
    print(f"{res['vid']:<12} | {res['status']:<8} | {res['cycles']:<5} | {res['soh_reg']:<5.1f} | {str(res['soh_pred']):<6} | {str(res['rul_pred']):<6} | {str(res['mileage_pred']):<6} | {th:<10} | {str(res['knee_rul']):<8} | {mg:<16} | {str(res['copilot_urgency']):<8}")

print("\n" + "="*50)
print("QA AUDIT DIAGNOSTICS & VERIFICATION:")
print("="*50)
if issues_found:
    for iss in issues_found:
        print("  - " + iss)
else:
    print("  [ALL PHYSICAL CHECKS PASSED]")

# Print summary of modules
print("\nMODULE INTEGRITY CHECKS:")
print(f"Module A (SOC, SOH, RUL, Mileage): {[r['soh_pred'] is not None for r in results]}")
print(f"Module B (Thermal, Vehicle Diagnosis): {[r['thermal_safety'] is not None for r in results]}")
print(f"Module C (Driver, Knee, Meta-Ensemble): {[r['meta_grade'] is not None for r in results]}")
