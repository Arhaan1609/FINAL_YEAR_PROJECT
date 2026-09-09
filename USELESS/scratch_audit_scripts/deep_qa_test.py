import requests
import json

BASE = "http://localhost:8000"

test_cases = [
    {
        "desc": "Brand New / Pristine Vehicle (Cycle 10, 98% SOH)",
        "vehicle_id": "NEW_VEH_01",
        "cycle": 10,
        "soh": 98.0,
        "soc": 85.0,
        "v": 79.5,
        "t": 28.0,
        "i": -15.0,
        "speed": 35.0
    },
    {
        "desc": "Nominal Mid-Life Fleet Vehicle (DL1LAK8816 - Cycle 448, 87.8% SOH)",
        "vehicle_id": "DL1LAK8816",
        "cycle": 448,
        "soh": 87.8,
        "soc": 55.0,
        "v": 74.4,
        "t": 36.0,
        "i": -16.0,
        "speed": 40.0
    },
    {
        "desc": "Aged High-Cycle Vehicle (Cycle 780, 80% SOH)",
        "vehicle_id": "AGED_VEH_03",
        "cycle": 780,
        "soh": 80.0,
        "soc": 30.0,
        "v": 71.2,
        "t": 39.0,
        "i": -22.0,
        "speed": 38.0
    },
    {
        "desc": "Thermal Danger / Overheating Pack (52 deg C, -45A current)",
        "vehicle_id": "HOT_VEH_04",
        "cycle": 350,
        "soh": 85.0,
        "soc": 45.0,
        "v": 72.0,
        "t": 52.0,
        "i": -45.0,
        "speed": 48.0
    }
]

for tc in test_cases:
    print("=" * 60)
    print(f"TEST CASE: {tc['desc']}")
    print(f"Inputs: Cycle={tc['cycle']}, SOC={tc['soc']}%, V={tc['v']}V, T={tc['t']}C, I={tc['i']}A")
    
    # 1. Module A
    soc_res = requests.post(f"{BASE}/predict/soc", json={"battery_voltage": tc["v"], "battery_current": tc["i"], "battery_temp": tc["t"]}).json()
    soh_res = requests.post(f"{BASE}/predict/soh", json={"vehicle_id": tc["vehicle_id"], "charge_cycle_count": tc["cycle"], "initial_soh": tc["soh"], "battery_voltage": tc["v"], "battery_current": tc["i"], "battery_temp": tc["t"]}).json()
    rul_res = requests.post(f"{BASE}/predict/rul", json={"charge_cycle_count": tc["cycle"], "soh": tc["soh"], "battery_voltage": tc["v"]}).json()
    mil_res = requests.post(f"{BASE}/predict/mileage", json={"vehicle_id": tc["vehicle_id"], "soc": tc["soc"], "initial_soh": tc["soh"], "charge_cycle_count": tc["cycle"]}).json()
    
    print(f"Module A -> SOC: {soc_res.get('prediction')}%, SOH: {soh_res.get('prediction')}%, RUL: {rul_res.get('prediction')} cycles, Mileage: {mil_res.get('prediction')} km")
    
    # 2. Module B
    thm_res = requests.post(f"{BASE}/predict/thermal", json={"vbt": tc["t"], "vct": tc["t"]+8, "vmt": tc["t"]+15, "vbv": tc["v"], "vbc": tc["i"], "soc": tc["soc"], "speed": tc["speed"]}).json()
    diag_res = requests.post(f"{BASE}/predict/diagnose/vehicle", json={"vehicle_id": tc["vehicle_id"], "soc": tc["soc"], "voltage": tc["v"], "current": tc["i"], "battery_temp": tc["t"], "speed": tc["speed"]}).json()
    print(f"Module B -> Thermal Safety: {thm_res.get('safety_status')} (Risk: {thm_res.get('risk_probability')}), Health Score: {diag_res.get('overall_health_score')}, Mode: {diag_res.get('fleet_operating_mode')}")
    
    # 3. Module C
    beh_res = requests.post(f"{BASE}/predict/driver-behavior", json={"battery_temp_max": tc["t"], "max_discharge_current": abs(tc["i"]), "avg_speed": tc["speed"], "max_speed": tc["speed"]+15}).json()
    knee_res = requests.post(f"{BASE}/predict/knee-point", json={"charge_cycle_count": tc["cycle"], "voltage": tc["v"], "battery_temp": tc["t"], "current": tc["i"], "soc": tc["soc"]}).json()
    meta_res = requests.post(f"{BASE}/predict/meta-ensemble", json={"vehicle_id": tc["vehicle_id"], "charge_cycle_count": tc["cycle"], "battery_voltage": tc["v"], "battery_temp": tc["t"], "battery_current": tc["i"], "soc": tc["soc"]}).json()
    print(f"Module C -> Aggressiveness: {beh_res.get('aggressiveness_index')}, Stress: {beh_res.get('battery_stress_index')}, Knee RUL: {knee_res.get('rul_to_knee_cycles')} cyc, Meta-Ensemble: SOH={meta_res.get('estimated_soh')}%, Grade={meta_res.get('unified_health_grade')}")
