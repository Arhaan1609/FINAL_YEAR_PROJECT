import sys
import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

# Fetch vehicles from database
vehicles_req = urllib.request.urlopen(f"{BASE_URL}/api/v1/db/vehicles?limit=15")
vehicles_data = json.loads(vehicles_req.read().decode())
vehicles = vehicles_data.get("vehicles", [])

print(f"Loaded {len(vehicles)} vehicles from backend.")

def canonical_triage_label(status: str) -> str:
    mapping = {
        "CRITICAL": "SERVICE HOLD",
        "WARNING": "ROUTE ADVISORY",
        "NOMINAL": "APPROVED FOR DISPATCH"
    }
    return mapping.get(status, status)

def resolve_triage_backend(soh, soc, temp, status):
    if status == "critical" or soh < 74.0 or temp > 52.0:
        return "CRITICAL"
    if status == "warning" or soh < 79.0 or temp > 46.0 or soc < 20.0:
        return "WARNING"
    return "NOMINAL"

results = []

for v in vehicles:
    vid = v["id"]
    soh = v["soh"]
    soc = v["soc"]
    temp = v["battery_temp"]
    status = v["status"]
    
    # 1. Expected triage from unified formula
    expected_urgency = resolve_triage_backend(soh, soc, temp, status)
    expected_label = canonical_triage_label(expected_urgency)
    
    # 2. Call Copilot explain-vehicle
    payload = {
        "vehicle_id": vid,
        "telemetry": v,
        "predictions": {
            "soc": soc,
            "soh": soh,
            "rul": v.get("rul", 1000),
            "mileage": v.get("mileage", 100)
        },
        "force_refresh": False
    }
    
    req = urllib.request.Request(
        f"{BASE_URL}/copilot/explain-vehicle",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        resp = urllib.request.urlopen(req)
        ai_data = json.loads(resp.read().decode())
        ai_urgency = ai_data.get("urgency")
        ai_label = canonical_triage_label(ai_urgency)
        
        match = (ai_urgency == expected_urgency)
        results.append({
            "vehicle_id": vid,
            "soh": soh,
            "soc": soc,
            "temp": temp,
            "expected_urgency": expected_urgency,
            "ai_urgency": ai_urgency,
            "label": ai_label,
            "match": match
        })
        print(f"[{'PASS' if match else 'FAIL'}] {vid}: SOH={soh:.1f}%, SOC={soc:.1f}%, Temp={temp:.1f}C -> Triage: {ai_label} (Urgency: {ai_urgency})")
    except Exception as e:
        print(f"[ERROR] {vid}: {e}")
        results.append({
            "vehicle_id": vid,
            "match": False,
            "error": str(e)
        })

errors = (len(vehicles) - len(results)) + sum(1 for r in results if not r.get("match", False))
all_pass = bool(results) and errors == 0 and all(r["match"] for r in results)
print("\n" + "="*70)
print(f"TRIAGE ALIGNMENT AUDIT: {'100% PERFECT MATCH' if all_pass else 'MISMATCH DETECTED'} "
      f"({len(results)} checked, {errors} errors)")
print("="*70)
sys.exit(0 if all_pass else 1)
