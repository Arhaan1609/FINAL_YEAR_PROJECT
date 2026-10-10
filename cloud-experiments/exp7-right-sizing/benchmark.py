"""
benchmark.py — Performance benchmark for EV Battery Intelligence API.

Sends real inference requests to the /predict/soc endpoint and measures:
  - Total execution time
  - Average, p50, p95, p99 latency
  - Throughput (requests/second)
  - Failed requests
  - Peak memory (container, if available)

Usage:
  python cloud-experiments/exp7-right-sizing/benchmark.py [OPTIONS]

Options:
  --url         Backend base URL (default: http://localhost:8000)
  --requests    Number of requests to send (default: 100)
  --concurrency Concurrent workers (default: 5)
  --output      Output CSV file (default: cloud-experiments/exp7-right-sizing/results/benchmark_results.csv)
  --config-name Label for this configuration (default: baseline)
"""

import argparse
import csv
import json
import os
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ── Sample SOC prediction request (valid input matching SOCRequest schema)
SOC_PAYLOAD = json.dumps({
    "battery_voltage": 72.5,
    "battery_temp": 35.0,
    "battery_current": -18.5,
    "abs_current": 18.5,
    "is_charging": 0,
    "odometer": 12500.0,
    "odometer_diff": 15.2,
    "voltage_deviation": 0.5,
    "temp_stress_index": 0.3,
    "drive_mode_encoded": 1,
    "hour": 14,
    "day_of_week": 3,
    "month": 7,
    "is_weekend": 0,
    "is_peak": 1,
    "oem_encoded": 0,
    "model_encoded": 0
}).encode("utf-8")

# ── Additional endpoint payloads for multi-endpoint benchmarking
RUL_PAYLOAD = json.dumps({
    "odometer": 15000.0,
    "charge_cycle_count": 250.0,
    "soc_at_charge": 82.0,
    "battery_temp": 38.0,
    "soh": 88.5,
    "soh_mean": 87.0,
    "mile_avg": 85.0,
    "miles_per_charge": 90.0,
    "days_in_service": 220.0,
    "degradation_factor": -0.05,
    "miles_per_charge_rolling_3": 88.0,
    "miles_per_charge_rolling_5": 87.0,
    "miles_per_charge_rolling_10": 86.0,
    "oem_encoded": 0,
    "model_encoded": 0
}).encode("utf-8")

THERMAL_PAYLOAD = json.dumps({
    "vbt": 42.0,
    "vct": 55.0,
    "vmt": 68.0,
    "vbv": 72.0,
    "vbc": -20.0,
    "soc": 65.0,
    "speed": 35.0
}).encode("utf-8")


def send_request(url: str, payload: bytes) -> dict:
    """Send a single POST request and return timing + status."""
    start = time.perf_counter()
    try:
        req = Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=30) as resp:
            resp.read()
            elapsed = (time.perf_counter() - start) * 1000  # ms
            return {"status": resp.status, "latency_ms": elapsed, "error": None}
    except HTTPError as e:
        elapsed = (time.perf_counter() - start) * 1000
        return {"status": e.code, "latency_ms": elapsed, "error": str(e)}
    except (URLError, Exception) as e:
        elapsed = (time.perf_counter() - start) * 1000
        return {"status": 0, "latency_ms": elapsed, "error": str(e)}


def check_health(base_url: str) -> bool:
    """Verify backend is healthy before benchmarking."""
    try:
        req = Request(f"{base_url}/health")
        with urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            print(f"  Health status: {data.get('status', 'unknown')}")
            return resp.status == 200
    except Exception as e:
        print(f"  Health check failed: {e}")
        return False


def get_container_stats(container_name: str = "ev-battery-backend") -> dict:
    """Try to get Docker container memory stats."""
    try:
        import subprocess
        result = subprocess.run(
            ["docker", "stats", container_name, "--no-stream", "--format",
             "{{.MemUsage}} | {{.CPUPerc}}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return {"container_stats": result.stdout.strip()}
    except Exception:
        pass
    return {"container_stats": "N/A"}


def run_benchmark(base_url: str, num_requests: int, concurrency: int,
                  endpoint: str = "/predict/soc", payload: bytes = SOC_PAYLOAD) -> dict:
    """Run the benchmark and return aggregated metrics."""
    url = f"{base_url}{endpoint}"
    print(f"\n  Benchmarking: POST {url}")
    print(f"  Requests: {num_requests}, Concurrency: {concurrency}")

    latencies = []
    errors = 0
    status_counts = {}

    # Pre-benchmark container stats
    pre_stats = get_container_stats()

    start_time = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(send_request, url, payload) for _ in range(num_requests)]
        for future in as_completed(futures):
            result = future.result()
            status = result["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
            if result["error"] or status >= 400:
                errors += 1
            else:
                latencies.append(result["latency_ms"])

    total_time = (time.perf_counter() - start_time) * 1000  # ms

    # Post-benchmark container stats
    post_stats = get_container_stats()

    if not latencies:
        print("  WARNING: All requests failed!")
        return {
            "total_requests": num_requests,
            "successful": 0,
            "failed": errors,
            "total_time_ms": round(total_time, 2),
            "avg_latency_ms": 0,
            "p50_latency_ms": 0,
            "p95_latency_ms": 0,
            "p99_latency_ms": 0,
            "min_latency_ms": 0,
            "max_latency_ms": 0,
            "throughput_rps": 0,
            "status_codes": status_counts,
            "pre_stats": pre_stats.get("container_stats", "N/A"),
            "post_stats": post_stats.get("container_stats", "N/A"),
        }

    sorted_lat = sorted(latencies)
    p95_idx = max(0, int(len(sorted_lat) * 0.95) - 1)
    p99_idx = max(0, int(len(sorted_lat) * 0.99) - 1)
    p50_idx = max(0, int(len(sorted_lat) * 0.50) - 1)

    metrics = {
        "total_requests": num_requests,
        "successful": len(latencies),
        "failed": errors,
        "total_time_ms": round(total_time, 2),
        "avg_latency_ms": round(statistics.mean(latencies), 2),
        "p50_latency_ms": round(sorted_lat[p50_idx], 2),
        "p95_latency_ms": round(sorted_lat[p95_idx], 2),
        "p99_latency_ms": round(sorted_lat[p99_idx], 2),
        "min_latency_ms": round(sorted_lat[0], 2),
        "max_latency_ms": round(sorted_lat[-1], 2),
        "throughput_rps": round(len(latencies) / (total_time / 1000), 2),
        "status_codes": status_counts,
        "pre_stats": pre_stats.get("container_stats", "N/A"),
        "post_stats": post_stats.get("container_stats", "N/A"),
    }
    return metrics


def print_metrics(metrics: dict, config_name: str):
    """Print benchmark results in a formatted table."""
    print(f"\n{'='*60}")
    print(f"  BENCHMARK RESULTS — Configuration: {config_name}")
    print(f"{'='*60}")
    print(f"  Total Requests:    {metrics['total_requests']}")
    print(f"  Successful:        {metrics['successful']}")
    print(f"  Failed:            {metrics['failed']}")
    print(f"  Total Time:        {metrics['total_time_ms']:.0f} ms")
    print(f"  Throughput:        {metrics['throughput_rps']:.1f} req/s")
    print(f"  Avg Latency:       {metrics['avg_latency_ms']:.1f} ms")
    print(f"  P50 Latency:       {metrics['p50_latency_ms']:.1f} ms")
    print(f"  P95 Latency:       {metrics['p95_latency_ms']:.1f} ms")
    print(f"  P99 Latency:       {metrics['p99_latency_ms']:.1f} ms")
    print(f"  Min Latency:       {metrics['min_latency_ms']:.1f} ms")
    print(f"  Max Latency:       {metrics['max_latency_ms']:.1f} ms")
    print(f"  Status Codes:      {metrics['status_codes']}")
    print(f"  Container Pre:     {metrics['pre_stats']}")
    print(f"  Container Post:    {metrics['post_stats']}")
    print(f"{'='*60}")


def save_csv(all_results: list, output_path: str):
    """Append benchmark results to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    file_exists = os.path.exists(output_path)

    fieldnames = [
        "timestamp", "config_name", "endpoint", "total_requests", "concurrency",
        "successful", "failed", "total_time_ms",
        "avg_latency_ms", "p50_latency_ms", "p95_latency_ms", "p99_latency_ms",
        "min_latency_ms", "max_latency_ms", "throughput_rps",
        "pre_container_stats", "post_container_stats"
    ]

    with open(output_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        for row in all_results:
            writer.writerow(row)

    print(f"\n  Results saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="EV Battery API Benchmark")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--requests", type=int, default=100, help="Number of requests")
    parser.add_argument("--concurrency", type=int, default=5, help="Concurrent workers")
    parser.add_argument("--output", default="cloud-experiments/exp7-right-sizing/results/benchmark_results.csv")
    parser.add_argument("--config-name", default="baseline", help="Configuration label")
    parser.add_argument("--endpoints", default="soc", help="Comma-separated: soc,rul,thermal")
    args = parser.parse_args()

    print("=" * 60)
    print("  EV Battery Intelligence — Performance Benchmark")
    print("=" * 60)
    print(f"  Target: {args.url}")
    print(f"  Config: {args.config_name}")

    # Health check
    print("\n  [1/3] Health check...")
    if not check_health(args.url):
        print("  FATAL: Backend is not healthy. Start the backend first.")
        sys.exit(1)

    # Run benchmarks for each endpoint
    endpoint_map = {
        "soc": ("/predict/soc", SOC_PAYLOAD),
        "rul": ("/predict/rul", RUL_PAYLOAD),
        "thermal": ("/predict/thermal", THERMAL_PAYLOAD),
    }

    endpoints = [e.strip() for e in args.endpoints.split(",")]
    all_results = []
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

    print(f"\n  [2/3] Running benchmarks for: {', '.join(endpoints)}...")
    for ep_name in endpoints:
        if ep_name not in endpoint_map:
            print(f"  WARNING: Unknown endpoint '{ep_name}', skipping.")
            continue

        path, payload = endpoint_map[ep_name]
        metrics = run_benchmark(args.url, args.requests, args.concurrency, path, payload)
        print_metrics(metrics, f"{args.config_name} / {ep_name}")

        all_results.append({
            "timestamp": timestamp,
            "config_name": args.config_name,
            "endpoint": ep_name,
            "total_requests": metrics["total_requests"],
            "concurrency": args.concurrency,
            "successful": metrics["successful"],
            "failed": metrics["failed"],
            "total_time_ms": metrics["total_time_ms"],
            "avg_latency_ms": metrics["avg_latency_ms"],
            "p50_latency_ms": metrics["p50_latency_ms"],
            "p95_latency_ms": metrics["p95_latency_ms"],
            "p99_latency_ms": metrics["p99_latency_ms"],
            "min_latency_ms": metrics["min_latency_ms"],
            "max_latency_ms": metrics["max_latency_ms"],
            "throughput_rps": metrics["throughput_rps"],
            "pre_container_stats": metrics["pre_stats"],
            "post_container_stats": metrics["post_stats"],
        })

    # Save results
    print(f"\n  [3/3] Saving results...")
    save_csv(all_results, args.output)

    print("\n  Benchmark complete.")


if __name__ == "__main__":
    main()
