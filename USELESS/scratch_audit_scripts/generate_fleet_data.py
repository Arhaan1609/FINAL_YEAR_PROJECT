import json
import random

# Seed for reproducible authentic data
random.seed(42)

TOTAL_COUNT = 778
TARGET_ACTIVE = 407
TARGET_WARNING = 346
TARGET_CRITICAL = 25

STATES = [
    {
        "code": "DL",
        "name": "Delhi",
        "hubs": ["Delhi NCR Fleet Hub", "Delhi Logistics Terminal"],
        "weight": 280,
    },
    {
        "code": "KA",
        "name": "Karnataka",
        "hubs": ["Bengaluru Metro Hub", "Bengaluru Logistics Terminal"],
        "weight": 170,
    },
    {
        "code": "MH",
        "name": "Maharashtra",
        "hubs": ["Mumbai Western Logistics Depot", "Pune Industrial Corridor"],
        "weight": 130,
    },
    {
        "code": "TN",
        "name": "Tamil Nadu",
        "hubs": ["Chennai Port Fleet Terminal", "Coimbatore Freight Depot"],
        "weight": 80,
    },
    {
        "code": "GJ",
        "name": "Gujarat",
        "hubs": ["Ahmedabad Freight Hub", "Surat Logistics Terminal"],
        "weight": 70,
    },
    {
        "code": "UP",
        "name": "Uttar Pradesh",
        "hubs": ["Lucknow Central Fleet Depot", "Noida Express Corridor"],
        "weight": 48,
    },
]

# Ensure weights sum to 778
assert sum(s["weight"] for s in STATES) == TOTAL_COUNT

MODELS = [
    {"name": "Euler HiLoad EV (12.4 kWh)", "oem": "Euler", "ratio": 0.42},
    {"name": "Tata Ace EV (14.2 kWh)", "oem": "Tata", "ratio": 0.35},
    {"name": "Mahindra Treo Zor (7.37 kWh)", "oem": "Mahindra", "ratio": 0.23},
]

# Assign statuses according to target counts
statuses = (
    ["active"] * TARGET_ACTIVE +
    ["warning"] * TARGET_WARNING +
    ["critical"] * TARGET_CRITICAL
)
random.shuffle(statuses)

vehicles = []
status_idx = 0

for state in STATES:
    state_code = state["code"]
    count = state["weight"]
    
    for i in range(count):
        st = statuses[status_idx]
        status_idx += 1
        
        # Distribute models across state
        if i % 10 < 4:
            model_info = MODELS[0]  # Euler
        elif i % 10 < 7:
            model_info = MODELS[1]  # Tata
        else:
            model_info = MODELS[2]  # Mahindra
            
        hub = state["hubs"][i % len(state["hubs"])]
        
        # Registration number generation (DL1LAK7203, KA04AD0190, MH02EV1042, etc.)
        if state_code == "DL":
            series = ["1LAK", "1LAN", "51GD", "01EV", "12EV"][i % 5]
            num = 1000 + (i * 23) % 9000
            vid = f"DL{series}{num}"
        elif state_code == "KA":
            series = ["04AD", "01EV", "05EV", "53EV", "03EV"][i % 5]
            num = 100 + (i * 19) % 900
            vid = f"KA{series}{num:04d}"
        elif state_code == "MH":
            series = ["02EV", "12EV", "01EV", "14EV", "04EV"][i % 5]
            num = 1000 + (i * 31) % 9000
            vid = f"MH{series}{num}"
        elif state_code == "TN":
            series = ["09EV", "01EV", "07EV", "10EV", "22EV"][i % 5]
            num = 1000 + (i * 37) % 9000
            vid = f"TN{series}{num}"
        elif state_code == "GJ":
            series = ["01EV", "05CV", "27EV", "06EV", "18EV"][i % 5]
            num = 1000 + (i * 41) % 9000
            vid = f"GJ{series}{num}"
        elif state_code == "UP":
            series = ["32EV", "16EV", "14EV", "70EV", "15EV"][i % 5]
            num = 1000 + (i * 43) % 9000
            vid = f"UP{series}{num}"

        # Cycles & degradation
        if st == "critical":
            cycles = random.randint(650, 980)
            soh = round(random.uniform(72.0, 79.5), 1)
            soc = round(random.uniform(15.0, 38.0), 1)
            battery_temp = round(random.uniform(46.0, 53.5), 1)
            rul = random.randint(120, 320)
            mileage = round(random.uniform(55.0, 72.0), 1)
            speed = round(random.uniform(18.0, 28.0), 1)
            voltage = round(random.uniform(68.0, 72.5), 1)
            current = round(random.uniform(-35.0, -22.0), 1)
        elif st == "warning":
            cycles = random.randint(350, 680)
            soh = round(random.uniform(80.0, 89.5), 1)
            soc = round(random.uniform(25.0, 55.0), 1)
            battery_temp = round(random.uniform(36.0, 44.5), 1)
            rul = random.randint(450, 890)
            mileage = round(random.uniform(75.0, 95.0), 1)
            speed = round(random.uniform(25.0, 38.0), 1)
            voltage = round(random.uniform(72.0, 76.5), 1)
            current = round(random.uniform(-25.0, -15.0), 1)
        else: # active
            cycles = random.randint(60, 380)
            soh = round(random.uniform(90.0, 98.8), 1)
            soc = round(random.uniform(55.0, 98.0), 1)
            battery_temp = round(random.uniform(26.0, 34.5), 1)
            rul = random.randint(950, 1550)
            mileage = round(random.uniform(98.0, 122.0), 1)
            speed = round(random.uniform(30.0, 42.0), 1)
            voltage = round(random.uniform(76.0, 81.5), 1)
            current = round(random.uniform(-18.0, -8.0), 1)
            
        controller_temp = round(battery_temp + random.uniform(4.0, 8.0), 1)
        motor_temp = round(battery_temp + random.uniform(12.0, 20.0), 1)
        last_ping = f"{random.randint(1, 12)} mins ago"
        
        vehicles.append({
            "id": vid,
            "chassis": f"CN-{vid}",
            "model": model_info["name"],
            "fleet": hub,
            "driver": f"Unit {vid}",
            "soc": soc,
            "soh": soh,
            "rul": rul,
            "mileage": mileage,
            "battery_temp": battery_temp,
            "controller_temp": controller_temp,
            "motor_temp": motor_temp,
            "voltage": voltage,
            "current": current,
            "speed": speed,
            "charge_cycle_count": cycles,
            "status": st,
            "lastPing": last_ping,
        })

# Keep famous benchmark vehicles first if desired, or make sure DL1LAK7203 and KA04AD0190 exist
# Check if DL1LAK7203 is present, if not, set first vehicle
vehicles[0]["id"] = "DL1LAK7203"
vehicles[0]["chassis"] = "CN-DL1LAK7203"
vehicles[0]["model"] = "Euler HiLoad EV (12.4 kWh)"
vehicles[0]["fleet"] = "Delhi NCR Fleet Hub"
vehicles[0]["driver"] = "Unit DL1LAK7203"
vehicles[0]["status"] = "active"

# Find a KA vehicle and make it KA04AD0190
for v in vehicles:
    if v["id"].startswith("KA"):
        v["id"] = "KA04AD0190"
        v["chassis"] = "CN-KA04AD0190"
        v["model"] = "Tata Ace EV (14.2 kWh)"
        v["fleet"] = "Bengaluru Metro Hub"
        v["driver"] = "Unit KA04AD0190"
        v["status"] = "active"
        break

# Verify unique IDs
seen = set()
for v in vehicles:
    if v["id"] in seen:
        v["id"] = f"{v['id'][:6]}{random.randint(10, 99)}"
        v["chassis"] = f"CN-{v['id']}"
        v["driver"] = f"Unit {v['id']}"
    seen.add(v["id"])

print(f"Generated {len(vehicles)} vehicles across all 6 states & 3 manufacturers.")

# Check breakdown
from collections import defaultdict, Counter
matrix = defaultdict(int)
for v in vehicles:
    oem = v["model"].split()[0]
    pfx = v["id"][:2]
    matrix[(oem, pfx)] += 1

print("\nMatrix (OEM in State):")
for (oem, pfx), cnt in sorted(matrix.items()):
    print(f"  {oem} in {pfx}: {cnt}")

print("\nStatuses:", Counter(v["status"] for v in vehicles))

with open("frontend/public/data/fleet_vehicles.json", "w") as f:
    json.dump(vehicles, f, indent=2)

print("\nSaved to frontend/public/data/fleet_vehicles.json successfully!")
