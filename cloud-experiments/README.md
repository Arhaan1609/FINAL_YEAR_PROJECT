# Cloud Computing Experiments — EV Battery Intelligence System

This directory contains **isolated** cloud computing experiments that containerize and deploy the existing EV Battery Intelligence System **without modifying any source files**.

## Project Overview

The EV Battery Intelligence System is a tri-pillar ML platform:

| Module | Purpose | Stack |
|--------|---------|-------|
| **Module A** | Fleet predictions (SOC, SOH, RUL, Mileage) | scikit-learn, XGBoost |
| **Module B** | Thermal fault detection + SOH deep estimation | PyTorch CNN-LSTM, RF |
| **Module C** | Driver behavior + knee-point prognostics | XGBoost, BA-BMS |

- **Backend**: FastAPI on port `8000`
- **Frontend**: Next.js on port `3000`

## Experiments

| Experiment | Directory | Description |
|------------|-----------|-------------|
| **Exp 2** | `exp2-docker/` | Docker containerization & Docker Hub workflow |
| **Exp 3** | `exp3-kubernetes/` | Kubernetes deployment on docker-desktop |
| **Exp 7** | `exp7-right-sizing/` | Resource right-sizing & performance benchmarking |
| **Exp 8** | `exp8-finops/` | FinOps cost-efficient resource comparison |

## Prerequisites

- Docker Engine ≥ 28.x (running)
- Docker Compose ≥ v2.x
- kubectl with `docker-desktop` context
- Python 3.10+
- PowerShell (Windows)

## Execution Order

```
1. Exp 2 → Build & push Docker images
2. Exp 3 → Deploy to Kubernetes using those images
3. Exp 7 → Benchmark with varying resource configurations
4. Exp 8 → Analyze costs based on benchmark results
```

## Important Notes

- **No existing files were modified** — all experiment files are isolated here.
- Frontend connects to backend via `NEXT_PUBLIC_API_BASE_URL` env var.
- The `docker-desktop` Kubernetes cluster uses local Docker images (set `imagePullPolicy: Never`).
- All resource limits are tuned for Docker Desktop's ~7.6 GiB memory allocation.
