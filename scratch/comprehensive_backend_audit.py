import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, method, url, payload=None, expected_status=200):
    try:
        if method == "GET":
            res = requests.get(f"{BASE_URL}{url}", timeout=5)
        elif method == "POST":
            res = requests.post(f"{BASE_URL}{url}", json=payload, timeout=5)
        
        status_ok = (res.status_code == expected_status)
        if status_ok:
            data = res.json()
            print(f"[PASS] {name}: status={res.status_code}")
            return True, data
        else:
            print(f"[FAIL] {name}: status={res.status_code}, response={res.text[:120]}")
            return False, res.text
    except Exception as e:
        print(f"[ERROR] {name}: {e}")
        return False, str(e)

def run_all_tests():
    print("=== STARTING ACCURATE BACKEND API AUDIT ===")
    results = []

    # 1. Health
    ok, _ = test_endpoint("Health Check", "GET", "/health")
    results.append(ok)

    # 2. DB Vehicles
    ok, data = test_endpoint("Fleet Vehicles", "GET", "/api/v1/db/vehicles")
    results.append(ok)
    if ok and data.get('vehicles'):
        vlist = data.get('vehicles')
        print(f"       -> Retrieved {len(vlist)} vehicles. First vehicle: {vlist[0].get('id')}")

    # 3. Fleet Summary
    ok, summary = test_endpoint("Fleet DB Summary", "GET", "/api/v1/db/summary")
    results.append(ok)
    if ok:
        print(f"       -> Total vehicles: {summary.get('total_vehicles')}, Avg SOC: {summary.get('avg_soc')}%")

    # 4. Module A Engines for SOC
    telemetry_soc = {
        "battery_voltage": 72.5,
        "battery_temp": 32.0,
        "battery_current": -15.0,
        "abs_current": 15.0,
        "is_charging": 0,
        "odometer": 15400.0,
        "voltage_deviation": 0.5,
        "temp_stress_index": 0.12,
        "drive_mode_encoded": 1
    }
    for engine in ["xgboost", "knn", "random_forest", "extratrees", "ridge"]:
        payload = {**telemetry_soc, "engine": engine}
        ok, res = test_endpoint(f"SOC Prediction ({engine})", "POST", "/predict/soc", payload)
        results.append(ok)
        if ok:
            print(f"       -> soc={res.get('prediction')}%, model={res.get('model_used')}")

    # 5. Module A Engines for SOH
    telemetry_soh = {
        "battery_voltage": 72.5,
        "battery_temp": 32.0,
        "battery_current": -15.0,
        "abs_current": 15.0,
        "odometer": 15400.0,
        "charge_cycle_count": 320.0,
        "mile_avg": 85.0,
        "miles_per_charge": 90.0,
        "days_in_service": 210.0,
        "degradation_factor": 0.05,
        "temp_stress_index": 0.15,
        "voltage_deviation": 0.5
    }
    for engine in ["xgboost", "random_forest", "extratrees", "ridge"]:
        payload = {**telemetry_soh, "engine": engine}
        ok, res = test_endpoint(f"SOH Prediction ({engine})", "POST", "/predict/soh", payload)
        results.append(ok)
        if ok:
            print(f"       -> soh={res.get('prediction')}%, model={res.get('model_used')}")

    # 6. Module A Engines for RUL
    telemetry_rul = {
        "odometer": 15400.0,
        "charge_cycle_count": 320.0,
        "soc_at_charge": 85.0,
        "battery_temp": 32.0,
        "soh": 91.5,
        "soh_mean": 92.0,
        "mile_avg": 85.0,
        "miles_per_charge": 90.0,
        "days_in_service": 210.0
    }
    for engine in ["xgboost", "random_forest", "extratrees", "ridge"]:
        payload = {**telemetry_rul, "engine": engine}
        ok, res = test_endpoint(f"RUL Prediction ({engine})", "POST", "/predict/rul", payload)
        results.append(ok)
        if ok:
            print(f"       -> rul={res.get('prediction')} cycles, model={res.get('model_used')}")

    # 7. Module A Engines for Mileage
    telemetry_mileage = {
        "run_kms": 45.0,
        "avg_speed": 32.0,
        "max_speed": 55.0,
        "trip_duration_hrs": 1.5,
        "stoppage_count": 2,
        "energy_efficiency": 0.88,
        "trip_intensity": 1.2,
        "speed_ratio": 0.58,
        "stoppage_density": 0.05,
        "energy_utilized": 8.5,
        "drive_mode_encoded": 1,
        "soc": 78.0,
        "soh": 92.0,
        "battery_voltage": 72.0,
        "battery_temp": 32.0
    }
    for engine in ["extratrees", "xgboost", "random_forest", "ridge"]:
        payload = {**telemetry_mileage, "engine": engine}
        ok, res = test_endpoint(f"Mileage Prediction ({engine})", "POST", "/predict/mileage", payload)
        results.append(ok)
        if ok:
            print(f"       -> mileage={res.get('prediction')} km, model={res.get('model_used')}")

    # 8. Module B Thermal
    thermal_payload = {
        "vbt": 34.5,
        "vct": 38.0,
        "vmt": 42.0,
        "vbv": 72.0,
        "vbc": -18.0,
        "soc": 75.0,
        "speed": 35.0
    }
    ok, res = test_endpoint("Module B Thermal Safety", "POST", "/predict/thermal", thermal_payload)
    results.append(ok)
    if ok:
        print(f"       -> safety_status={res.get('safety_status')}, severity={res.get('severity')}")

    # 9. Module B Vehicle Diagnosis
    diag_payload = {
        "vehicle_id": "DL1LAK7203",
        "oem_model": "Euler HiLoad EV",
        "soc": 78.0,
        "voltage": 72.0,
        "current": -15.0,
        "battery_temp": 32.0,
        "controller_temp": 38.0,
        "motor_temp": 42.0,
        "speed": 35.0
    }
    ok, res = test_endpoint("Module B Diagnose Vehicle", "POST", "/predict/diagnose/vehicle", diag_payload)
    results.append(ok)
    if ok:
        print(f"       -> health_score={res.get('overall_health_score')}, alert={res.get('critical_alert')}")

    # 10. Module C Driver Behavior
    driver_payload = {
        "harsh_accel_count": 2.0,
        "harsh_brake_count": 1.0,
        "harsh_corner_count": 0.0,
        "speed_variance": 4.5,
        "avg_speed": 34.0,
        "max_speed": 58.0,
        "battery_temp_max": 34.0,
        "max_discharge_current": 28.0
    }
    ok, res = test_endpoint("Module C Driver Behavior", "POST", "/predict/driver-behavior", driver_payload)
    results.append(ok)
    if ok:
        print(f"       -> classification={res.get('driver_classification')}, ai={res.get('aggressiveness_index')}, bsi={res.get('battery_stress_index')}")

    # 11. Module C Knee-point
    knee_payload = {
        "charge_cycle_count": 350.0,
        "capacity": 92.0,
        "voltage": 72.0,
        "battery_temp": 32.0,
        "current": -15.0,
        "soc": 78.0,
        "speed": 35.0
    }
    ok, res = test_endpoint("Module C Knee-Point Prognostics", "POST", "/predict/knee-point", knee_payload)
    results.append(ok)
    if ok:
        print(f"       -> knee_risk={res.get('knee_risk_state')}, rul_to_knee={res.get('rul_to_knee_cycles')} cycles")

    # 12. Module C Meta-Ensemble
    meta_payload = {
        "vehicle_id": "DL1LAK7203",
        "charge_cycle_count": 350.0,
        "battery_voltage": 72.0,
        "battery_temp": 32.0,
        "battery_current": -15.0,
        "soc": 78.0,
        "harsh_accel_count": 2.0,
        "speed_variance": 4.5
    }
    ok, res = test_endpoint("Module C Meta-Ensemble", "POST", "/predict/meta-ensemble", meta_payload)
    results.append(ok)
    if ok:
        print(f"       -> grade={res.get('unified_health_grade')}, status={res.get('health_status')}")

    # 13. Copilot Chat
    copilot_payload = {
        "message": "What is the battery health of DL1LAK7203?",
        "history": [],
        "active_vehicle": {"id": "DL1LAK7203", "soc": 78, "soh": 92, "battery_temp": 29}
    }
    ok, res = test_endpoint("AI Battery Copilot Chat", "POST", "/copilot/chat", copilot_payload)
    results.append(ok)
    if ok:
        reply = res.get('reply', '')[:80] + "..." if len(res.get('reply', '')) > 80 else res.get('reply')
        print(f"       -> reply={reply}")

    # 14. Copilot Explain Vehicle
    explain_payload = {
        "vehicle_id": "DL1LAK7203",
        "telemetry": {"soc": 78, "soh": 92, "battery_temp": 29, "status": "active"},
        "predictions": {"soc": 78, "soh": 92, "rul": 950}
    }
    ok, res = test_endpoint("AI Copilot Explain Vehicle", "POST", "/copilot/explain-vehicle", explain_payload)
    results.append(ok)
    if ok:
        print(f"       -> summary={res.get('summary')[:70]}...")

    all_passed = all(results)
    print("===============================================")
    if all_passed:
        print(f"ALL {len(results)} BACKEND ENDPOINT TESTS PASSED PERFECTLY!")
    else:
        print(f"SOME TESTS FAILED: {results.count(False)} / {len(results)} failed.")
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
