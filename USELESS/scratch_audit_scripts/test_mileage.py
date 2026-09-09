import requests

for soc in [100, 85, 55, 30, 15]:
    for cycles in [10, 448, 780]:
        r = requests.post("http://localhost:8000/predict/mileage", json={
            "run_kms": 45.0,
            "avg_speed": 32.0,
            "max_speed": 48.0,
            "trip_duration_hrs": 1.4,
            "stoppage_count": 3,
            "energy_utilized": 7.2,
            "soc": float(soc),
            "charge_cycle_count": float(cycles),
            "initial_soh": max(75.0, 100.0 - cycles * 0.015)
        }).json()
        pred = r.get("prediction")
        print(f"SOC={soc:3d}%, cycles={cycles:4d} -> Mileage: {pred} km")
