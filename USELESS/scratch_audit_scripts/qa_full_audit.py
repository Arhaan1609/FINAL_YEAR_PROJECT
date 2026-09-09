import requests
import json
import time
import sys

BASE = "http://127.0.0.1:8000"

results = []

def test(name, method, endpoint, payload=None, params=None):
    t0 = time.perf_counter()
    try:
        if method == "GET":
            r = requests.get(f"{BASE}{endpoint}", params=params, timeout=15)
        else:
            r = requests.post(f"{BASE}{endpoint}", json=payload, timeout=15)
        dt = (time.perf_counter() - t0) * 1000
        return {
            "name": name,
            "endpoint": endpoint,
            "status": r.status_code,
            "latency_ms": round(dt, 1),
            "data": r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:200],
            "error": None
        }
    except Exception as e:
        dt = (time.perf_counter() - t0) * 1000
        return {
            "name": name,
            "endpoint": endpoint,
            "status": 0,
            "latency_ms": round(dt, 1),
            "data": None,
            "error": str(e)
        }

print("=== STARTING DEEP QA TEST SUITE ===")

# ----------------------------------------------------
# 1. DATABASE ENDPOINTS
# ----------------------------------------------------
res = test("DB Summary", "GET", "/api/v1/db/summary")
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

res = test("DB Vehicles (sample)", "GET", "/api/v1/db/vehicles", params={"limit": 5})
data = res["data"]
count = len(data.get("vehicles", [])) if isinstance(data, dict) else "err"
print(f"[{res['status']}] {res['name']}: count={count}")
results.append(res)

res = test("DB Single Vehicle DL1LAK8816", "GET", "/api/v1/db/vehicles/DL1LAK8816")
print(f"[{res['status']}] {res['name']}: id={res['data'].get('vehicle_id') if isinstance(res['data'], dict) else 'err'}")
results.append(res)

# ----------------------------------------------------
# 2. MODULE A ENDPOINTS (Euler HiLoad 12.4 kWh LFP: 74.4V, ~30-36°C, -16A)
# ----------------------------------------------------
soc_payload = {
    "battery_voltage": 74.4,
    "battery_current": -16.0,
    "battery_temp": 34.0,
    "abs_current": 16.0,
    "odometer": 26000.0,
    "charge_cycle_count": 448
}
res = test("Module A: /predict/soc", "POST", "/predict/soc", soc_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

soh_payload = {
    "battery_voltage": 74.4,
    "battery_current": -16.0,
    "battery_temp": 34.0,
    "charge_cycle_count": 448,
    "odometer": 26000.0,
    "initial_soh": 87.8,
    "soh": 87.8,
    "chassis_no": "CN-DL1LAK8816",
    "vehicle_id": "DL1LAK8816"
}
res = test("Module A: /predict/soh", "POST", "/predict/soh", soh_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

rul_payload = {
    "odometer": 26000.0,
    "charge_cycle_count": 448,
    "soc_at_charge": 55.0,
    "battery_temp": 34.0
}
res = test("Module A: /predict/rul", "POST", "/predict/rul", rul_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

mileage_payload = {
    "run_kms": 45.0,
    "avg_speed": 35.0,
    "max_speed": 55.0,
    "odometer": 26000.0,
    "charge_cycle_count": 448,
    "battery_temp": 34.0,
    "battery_voltage": 74.4,
    "state_of_charge": 55.1
}
res = test("Module A: /predict/mileage", "POST", "/predict/mileage", mileage_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

# ----------------------------------------------------
# 3. MODULE B ENDPOINTS
# ----------------------------------------------------
thermal_payload = {
    "vbt": 36.0,
    "vct": 43.5,
    "vmt": 51.0,
    "vbv": 74.4,
    "vbc": -16.0,
    "soc": 55.0,
    "speed": 35.0
}
res = test("Module B: /predict/thermal", "POST", "/predict/thermal", thermal_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

soh_deep_payload = {
    "sequence": [[74.4 - (i*0.01), -16.0 + (i*0.1), 34.0 + (i*0.05), 55.0 - (i*0.1)] for i in range(30)],
    "chassis_id": "CN-DL1LAK8816",
    "ambient_temp": 32.0,
    "cycle_count": 448
}
res = test("Module B: /predict/soh-deep", "POST", "/predict/soh-deep", soh_deep_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

vehicle_diag_payload = {
    "vehicle_id": "DL1LAK8816",
    "soc": 55.0,
    "voltage": 74.4,
    "current": -16.0,
    "battery_temp": 36.0,
    "controller_temp": 43.5,
    "motor_temp": 51.0,
    "speed": 35.0,
    "odometer_km": 448 * 58.0
}
res = test("Module B: /predict/diagnose/vehicle", "POST", "/predict/diagnose/vehicle", vehicle_diag_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

# ----------------------------------------------------
# 4. MODULE C ENDPOINTS
# ----------------------------------------------------
driver_payload = {
    "harsh_accel_count": 2,
    "harsh_brake_count": 1,
    "harsh_corner_count": 1,
    "speed_variance": 12.5,
    "avg_speed": 35.0,
    "max_speed": 55.0,
    "battery_temp_max": 36.0,
    "max_discharge_current": 25.0
}
res = test("Module C: /predict/driver-behavior", "POST", "/predict/driver-behavior", driver_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

knee_payload = {
    "charge_cycle_count": 448,
    "soh": 78.7,
    "historical_capacity_fade_rate": 0.025,
    "avg_cell_temperature": 34.0,
    "avg_c_rate": 0.35,
    "internal_resistance_mohm": 18.5
}
res = test("Module C: /predict/knee-point", "POST", "/predict/knee-point", knee_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

meta_payload = {
    "vehicle_id": "DL1LAK8816",
    "charge_cycle_count": 448.0,
    "battery_voltage": 74.4,
    "battery_temp": 36.0,
    "battery_current": -16.0,
    "soc": 55.1,
    "initial_soh": 78.7,
    "harsh_accel_count": 2.0,
    "speed_variance": 12.5
}
res = test("Module C: /predict/meta-ensemble", "POST", "/predict/meta-ensemble", meta_payload)
print(f"[{res['status']}] {res['name']}: {res['data']}")
results.append(res)

# ----------------------------------------------------
# 5. COPILOT ENDPOINTS
# ----------------------------------------------------
copilot_payload = {
    "vehicle_id": "DL1LAK8816",
    "telemetry": {
        "chassis": "CN-DL1LAK8816",
        "fleet": "Delhi NCR Fleet Hub",
        "battery_temp": 36.0,
        "controller_temp": 43.5,
        "motor_temp": 51.0,
        "voltage": 74.4,
        "current": -16.0,
        "speed": 50.0,
        "charge_cycle_count": 448,
        "status": "active"
    },
    "predictions": {
        "soc": 55.1,
        "soh": 78.7,
        "rul": 1245,
        "mileage": 98.4
    },
    "force_refresh": True
}
res = test("Copilot: /copilot/explain-vehicle", "POST", "/copilot/explain-vehicle", copilot_payload)
print(f"[{res['status']}] {res['name']}: urgency={res['data'].get('urgency') if isinstance(res['data'], dict) else 'err'}, model={res['data'].get('model_used') if isinstance(res['data'], dict) else 'err'}")
results.append(res)

chat_payload = {
    "message": "Why is DL1LAK8816 flagged with a Route Advisory when its registered status is Active?",
    "vehicle_id": "DL1LAK8816",
    "telemetry": {
        "soc": 55.1,
        "soh": 78.7,
        "charge_cycle_count": 448,
        "battery_temp": 36.0
    }
}
res = test("Copilot: /copilot/chat", "POST", "/copilot/chat", chat_payload)
print(f"[{res['status']}] {res['name']}: reply length={len(str(res['data']))}")
results.append(res)

with open("scratch/qa_results.json", "w") as f:
    json.dump(results, f, indent=2)

failures = [r for r in results if r["status"] != 200]
if failures:
    print(f"\nFAILURE: {len(failures)}/{len(results)} tests failed with non-200 status codes!")
    for f in failures:
        print(f"  - {f['name']}: Status {f['status']} -> {f['data']}")
else:
    print(f"\nSUCCESS: All {len(results)}/{len(results)} tests passed with HTTP 200 OK!")
print(f"Results saved to scratch/qa_results.json")
