# Experiment 7 — Resource Right-Sizing and Performance Benchmarking

## Overview

Benchmark the EV Battery Intelligence API under different resource configurations to identify the optimal (right-sized) allocation that balances performance and resource efficiency.

## Files

| File | Purpose |
|------|---------|
| `benchmark.py` | Sends real inference requests, measures latency/throughput |
| `analyze.py` | Reads CSV results, generates comparison report |
| `resource-configs.yaml` | Three resource tiers (over/intermediate/right-sized) |
| `run-benchmarks.bat` | Automated benchmark runner |
| `results/` | Output directory for CSV and reports |

## Prerequisites

- Backend running (via Docker Compose or directly):
  ```powershell
  # Option A: Docker
  docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d
  
  # Option B: Direct
  uvicorn api.main:app --host 0.0.0.0 --port 8000
  ```
- Python 3.10+ (no extra pip packages needed — uses only stdlib)

## Quick Start

```powershell
# From project root — run benchmark with current configuration
python cloud-experiments\exp7-right-sizing\benchmark.py --config-name "baseline"

# Or use the batch script
cloud-experiments\exp7-right-sizing\run-benchmarks.bat
```

## Full Right-Sizing Workflow

### Step 1: Benchmark with Over-Provisioned Resources

Edit `cloud-experiments/exp2-docker/docker-compose.yml` backend deploy limits (or use as-is for baseline):
```yaml
limits:
  memory: 6g
  cpus: "6.0"
```

```powershell
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d --build
# Wait for health check...
python cloud-experiments\exp7-right-sizing\benchmark.py ^
    --config-name "over-provisioned" --endpoints "soc,rul,thermal"
```

### Step 2: Benchmark with Intermediate Resources

```yaml
limits:
  memory: 4g
  cpus: "4.0"
```

```powershell
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d --build
python cloud-experiments\exp7-right-sizing\benchmark.py ^
    --config-name "intermediate" --endpoints "soc,rul,thermal"
```

### Step 3: Benchmark with Right-Sized Resources

```yaml
limits:
  memory: 3g
  cpus: "2.0"
```

```powershell
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d --build
python cloud-experiments\exp7-right-sizing\benchmark.py ^
    --config-name "right-sized" --endpoints "soc,rul,thermal"
```

### Step 4: Analyze & Compare

```powershell
python cloud-experiments\exp7-right-sizing\analyze.py
```

This generates `results/right_sizing_report.md` with comparison tables and recommendations.

## Benchmark Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--url` | `http://localhost:8000` | Backend URL |
| `--requests` | `100` | Requests per endpoint |
| `--concurrency` | `5` | Parallel workers |
| `--endpoints` | `soc` | Comma-separated: `soc,rul,thermal` |
| `--config-name` | `baseline` | Label for this run |
| `--output` | `results/benchmark_results.csv` | CSV output path |

## Metrics Collected

| Metric | Description |
|--------|-------------|
| Total time | Wall clock time for all requests |
| Avg latency | Mean request latency (ms) |
| P50 / P95 / P99 | Percentile latencies |
| Throughput | Requests per second |
| Failed requests | Non-2xx responses |
| Container stats | Docker memory/CPU usage (if running in Docker) |

## Resource Configurations

| Tier | Memory Limit | CPU Limit | Use Case |
|------|-------------|-----------|----------|
| Over-provisioned | 6 Gi | 6000m | Generous, wasteful |
| Intermediate | 4 Gi | 4000m | Balanced (default) |
| Right-sized | 3 Gi | 2000m | Minimal acceptable |

## Notes

- All benchmarks use identical real inference requests (SOC, RUL, Thermal endpoints).
- No synthetic or fake workloads — actual model inference is exercised.
- Results are appended to the same CSV, enabling multi-run comparison.
- Container memory stats require Docker Engine access (`docker stats`).
- On Docker Desktop with ~7.6 GiB total, avoid running multiple heavy containers simultaneously.
