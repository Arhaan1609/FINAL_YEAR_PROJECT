# Experiment 8 — FinOps and Cost-Efficient Resource Comparison

## Overview

Compare cloud deployment costs for the EV Battery Intelligence System across different resource configurations, using actual benchmark data from Experiment 7.

## Files

| File | Purpose |
|------|---------|
| `cost_analysis.py` | Reads benchmarks, applies pricing, generates CSV + report |
| `results/cost_analysis.csv` | Cost comparison data (generated) |
| `results/cost_report.md` | Full FinOps report with recommendations (generated) |

## Prerequisites

1. Benchmark data from Experiment 7:
   ```powershell
   # Verify benchmark CSV exists
   dir cloud-experiments\exp7-right-sizing\results\benchmark_results.csv
   ```
2. Python 3.10+ (no extra packages needed)

## Quick Start

```powershell
# From project root
python cloud-experiments\exp8-finops\cost_analysis.py
```

## What It Does

1. **Loads** benchmark results (latency, throughput, failures) from Experiment 7
2. **Maps** each resource configuration to a cloud instance type with published pricing
3. **Calculates**:
   - Hourly and monthly cost (assuming 24/7 continuous operation)
   - Cost per single benchmark run (short-run compute cost)
   - Cost per 1,000 inference requests
4. **Recommends** the least expensive configuration with zero failures

## Default Pricing (Editable)

| Configuration | AWS Instance | vCPU | RAM | $/Hour | $/Month |
|---------------|-------------|------|-----|--------|---------|
| Over-provisioned | m6i.2xlarge | 8 | 32 GB | $0.384 | $280.32 |
| Intermediate | m6i.xlarge | 4 | 16 GB | $0.192 | $140.16 |
| Right-sized | m6i.large | 2 | 8 GB | $0.096 | $70.08 |

> **Source**: AWS EC2 On-Demand Pricing, us-east-1, estimated Oct 2026.
> **⚠️**: These are estimated prices. Verify against the [current AWS pricing page](https://aws.amazon.com/ec2/pricing/on-demand/).

## Customizing Pricing

Edit the `DEFAULT_PRICING` dictionary in `cost_analysis.py`:

```python
DEFAULT_PRICING = {
    "provider": "GCP",          # Change provider
    "region": "us-central1",    # Change region
    "currency": "USD",
    "pricing_date": "2026-10-15",
    "instances": {
        "right-sized": {
            "instance_type": "e2-standard-2",
            "vcpu": 2,
            "memory_gb": 8,
            "on_demand_per_hour": 0.067,
            "description": "GCP e2-standard-2"
        },
        # ... other tiers
    }
}
```

## Cost Distinctions

| Cost Type | Description |
|-----------|-------------|
| **Short-run compute** | Cost for actual benchmark duration (seconds of compute) |
| **Continuous provisioning** | Monthly cost for a 24/7 running instance |
| **Per-request** | Estimated cost per 1,000 inference requests |

> The script clearly separates measured performance from estimated pricing.
> Actual cloud bills depend on reserved instances, spot pricing, data transfer, storage, and other services.

## Output Example

After running, check:
- `results/cost_analysis.csv` — machine-readable comparison
- `results/cost_report.md` — human-readable report with recommendation

## Notes

- No prices are fabricated — all values come from published cloud pricing or are clearly marked as editable templates.
- The analysis does NOT include storage (EBS/PD), data transfer, load balancers, monitoring, or frontend hosting costs.
- For multi-region or multi-cloud comparison, edit the pricing config and re-run.
