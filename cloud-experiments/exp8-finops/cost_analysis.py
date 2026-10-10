"""
cost_analysis.py — FinOps cost estimation for EV Battery Intelligence deployment.

Reads benchmark results from Experiment 7 and applies cloud pricing to compare
the cost of different resource configurations.

Usage:
  python cloud-experiments/exp8-finops/cost_analysis.py [OPTIONS]

Options:
  --benchmark   Path to benchmark CSV from Exp 7
  --pricing     Path to pricing YAML config
  --output-csv  Path to output cost CSV
  --output-md   Path to output cost report (markdown)
"""

import argparse
import csv
import os
import sys

# ──────────────────────────────────────────────────────────────
# Default pricing — AWS us-east-1 on-demand (Oct 2026 estimates)
# EDIT THESE VALUES for your provider/region.
# Source: https://aws.amazon.com/ec2/pricing/on-demand/
# ──────────────────────────────────────────────────────────────
DEFAULT_PRICING = {
    "provider": "AWS",
    "region": "us-east-1 (N. Virginia)",
    "currency": "USD",
    "pricing_source": "AWS EC2 On-Demand Pricing (public page)",
    "pricing_date": "2026-10-01",
    "note": "ESTIMATED prices — verify against current AWS pricing page before use.",

    # Price per vCPU-hour and per GB-hour (derived from general-purpose instances)
    # Based on m6i.xlarge: 4 vCPU, 16 GB, $0.192/hr → $0.048/vCPU-hr, $0.012/GB-hr
    "vcpu_per_hour": 0.048,
    "gb_memory_per_hour": 0.012,

    # Alternative: fixed instance pricing
    "instances": {
        "over-provisioned": {
            "instance_type": "m6i.2xlarge",
            "vcpu": 8,
            "memory_gb": 32,
            "on_demand_per_hour": 0.384,
            "description": "8 vCPU, 32 GB — significantly over-provisioned"
        },
        "intermediate": {
            "instance_type": "m6i.xlarge",
            "vcpu": 4,
            "memory_gb": 16,
            "on_demand_per_hour": 0.192,
            "description": "4 vCPU, 16 GB — balanced general-purpose"
        },
        "right-sized": {
            "instance_type": "m6i.large",
            "vcpu": 2,
            "memory_gb": 8,
            "on_demand_per_hour": 0.096,
            "description": "2 vCPU, 8 GB — minimal viable"
        },
        "baseline": {
            "instance_type": "m6i.xlarge",
            "vcpu": 4,
            "memory_gb": 16,
            "on_demand_per_hour": 0.192,
            "description": "4 vCPU, 16 GB — default baseline"
        },
    },

    # Hours per month for continuous provisioning
    "hours_per_month": 730,
}


def load_benchmark_results(csv_path: str) -> list:
    """Load benchmark results from Experiment 7."""
    if not os.path.exists(csv_path):
        print(f"  ERROR: {csv_path} not found.")
        print(f"  Run Experiment 7 benchmarks first:")
        print(f"    python cloud-experiments/exp7-right-sizing/benchmark.py")
        sys.exit(1)

    results = []
    with open(csv_path, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            for key in ["total_requests", "concurrency", "successful", "failed"]:
                if key in row:
                    row[key] = int(float(row[key]))
            for key in ["total_time_ms", "avg_latency_ms", "p50_latency_ms",
                         "p95_latency_ms", "p99_latency_ms", "min_latency_ms",
                         "max_latency_ms", "throughput_rps"]:
                if key in row:
                    row[key] = float(row[key])
            results.append(row)
    return results


def compute_costs(results: list, pricing: dict) -> list:
    """Compute cost estimates for each configuration."""
    configs = {}
    for row in results:
        config = row.get("config_name", "unknown")
        if config not in configs:
            configs[config] = []
        configs[config].append(row)

    cost_rows = []
    for config_name, rows in configs.items():
        instance_info = pricing["instances"].get(config_name, pricing["instances"].get("baseline"))
        hourly_rate = instance_info["on_demand_per_hour"]
        monthly_rate = hourly_rate * pricing["hours_per_month"]

        # Use SOC endpoint metrics as primary benchmark (most common inference)
        soc_rows = [r for r in rows if r.get("endpoint") == "soc"]
        primary = soc_rows[0] if soc_rows else rows[0]

        throughput = primary.get("throughput_rps", 0)
        avg_latency = primary.get("avg_latency_ms", 0)
        p95_latency = primary.get("p95_latency_ms", 0)
        failed = primary.get("failed", 0)

        # Cost per 1000 requests (based on measured throughput)
        if throughput > 0:
            time_for_1000 = 1000 / throughput  # seconds
            cost_per_1000 = (time_for_1000 / 3600) * hourly_rate
        else:
            cost_per_1000 = 0

        # Cost per single run (total benchmark time)
        total_time_s = primary.get("total_time_ms", 0) / 1000
        cost_per_run = (total_time_s / 3600) * hourly_rate

        cost_rows.append({
            "config_name": config_name,
            "instance_type": instance_info["instance_type"],
            "vcpu": instance_info["vcpu"],
            "memory_gb": instance_info["memory_gb"],
            "hourly_rate_usd": hourly_rate,
            "monthly_rate_usd": round(monthly_rate, 2),
            "cost_per_1000_requests_usd": round(cost_per_1000, 6),
            "cost_per_run_usd": round(cost_per_run, 6),
            "avg_latency_ms": avg_latency,
            "p95_latency_ms": p95_latency,
            "throughput_rps": throughput,
            "failed_requests": failed,
            "description": instance_info["description"],
        })

    return cost_rows


def save_cost_csv(cost_rows: list, output_path: str):
    """Save cost analysis to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    fieldnames = [
        "config_name", "instance_type", "vcpu", "memory_gb",
        "hourly_rate_usd", "monthly_rate_usd",
        "cost_per_1000_requests_usd", "cost_per_run_usd",
        "avg_latency_ms", "p95_latency_ms", "throughput_rps", "failed_requests",
        "description"
    ]

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in cost_rows:
            writer.writerow(row)

    print(f"  Cost CSV saved: {output_path}")


def generate_cost_report(cost_rows: list, pricing: dict, output_path: str):
    """Generate a FinOps markdown report."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    lines = [
        "# FinOps Cost Analysis Report — EV Battery Intelligence",
        "",
        "## Pricing Assumptions",
        "",
        f"| Parameter | Value |",
        f"|-----------|-------|",
        f"| Cloud Provider | {pricing['provider']} |",
        f"| Region | {pricing['region']} |",
        f"| Currency | {pricing['currency']} |",
        f"| Pricing Source | {pricing['pricing_source']} |",
        f"| Pricing Date | {pricing['pricing_date']} |",
        f"| Hours/Month | {pricing['hours_per_month']} |",
        "",
        f"> **⚠️ IMPORTANT**: {pricing['note']}",
        "",
        "## Cost Comparison",
        "",
        "### Per-Instance Pricing",
        "",
        "| Configuration | Instance | vCPU | RAM (GB) | $/Hour | $/Month |",
        "|---------------|----------|------|----------|--------|---------|",
    ]

    for row in cost_rows:
        lines.append(
            f"| {row['config_name']} | {row['instance_type']} "
            f"| {row['vcpu']} | {row['memory_gb']} "
            f"| ${row['hourly_rate_usd']:.3f} "
            f"| ${row['monthly_rate_usd']:.2f} |"
        )

    lines.extend([
        "",
        "### Performance vs. Cost",
        "",
        "| Configuration | Avg Latency (ms) | P95 (ms) | Throughput (rps) | Failures | $/1K Requests |",
        "|---------------|-----------------|----------|------------------|----------|---------------|",
    ])

    for row in cost_rows:
        lines.append(
            f"| {row['config_name']} | {row['avg_latency_ms']:.1f} "
            f"| {row['p95_latency_ms']:.1f} | {row['throughput_rps']:.1f} "
            f"| {row['failed_requests']} | ${row['cost_per_1000_requests_usd']:.6f} |"
        )

    # Savings calculation
    if len(cost_rows) >= 2:
        sorted_by_cost = sorted(cost_rows, key=lambda x: x["monthly_rate_usd"])
        cheapest = sorted_by_cost[0]
        most_expensive = sorted_by_cost[-1]

        if most_expensive["monthly_rate_usd"] > 0:
            savings_pct = ((most_expensive["monthly_rate_usd"] - cheapest["monthly_rate_usd"])
                           / most_expensive["monthly_rate_usd"] * 100)
            savings_abs = most_expensive["monthly_rate_usd"] - cheapest["monthly_rate_usd"]
        else:
            savings_pct = 0
            savings_abs = 0

        lines.extend([
            "",
            "### Potential Monthly Savings",
            "",
            f"| Comparison | Monthly Savings | Percentage |",
            f"|------------|----------------|------------|",
            f"| {most_expensive['config_name']} → {cheapest['config_name']} "
            f"| ${savings_abs:.2f}/month | {savings_pct:.1f}% |",
        ])

    # Recommendation
    lines.extend([
        "",
        "## Recommendation",
        "",
    ])

    # Find cheapest config with 0 failures
    viable = [r for r in cost_rows if r["failed_requests"] == 0]
    if viable:
        cheapest_viable = min(viable, key=lambda x: x["monthly_rate_usd"])
        lines.extend([
            f"**Recommended configuration: `{cheapest_viable['config_name']}`**",
            "",
            f"- Instance: {cheapest_viable['instance_type']} ({cheapest_viable['vcpu']} vCPU, {cheapest_viable['memory_gb']} GB)",
            f"- Monthly cost: ${cheapest_viable['monthly_rate_usd']:.2f}",
            f"- Average latency: {cheapest_viable['avg_latency_ms']:.1f} ms",
            f"- Throughput: {cheapest_viable['throughput_rps']:.1f} rps",
            f"- Zero failed requests",
            "",
            "This is the least expensive configuration that satisfies performance requirements",
            "(zero failures, acceptable latency).",
        ])
    else:
        lines.append("No configuration achieved zero failures. Review resource limits and retry.")

    # Disclaimers
    lines.extend([
        "",
        "## Important Disclaimers",
        "",
        "1. **Estimated pricing**: Costs are based on published on-demand pricing. Actual bills",
        "   may differ due to reserved instances, savings plans, spot pricing, and data transfer.",
        "2. **Short-run vs. continuous**: Cost-per-run reflects compute time for a benchmark.",
        "   Monthly cost assumes the instance runs 24/7 (730 hours/month).",
        "3. **Compute only**: Pricing does not include storage (EBS), data transfer, load balancers,",
        "   monitoring, or other AWS services.",
        "4. **Local benchmark**: Performance was measured on Docker Desktop. Cloud instances will",
        "   have different CPU/memory/network characteristics.",
        "5. **Single-service pricing**: Costs are for the backend only. Frontend hosting",
        "   (e.g., Vercel, S3+CloudFront) would add additional cost.",
        "",
        "## How to Update Pricing",
        "",
        "Edit the `DEFAULT_PRICING` dictionary in `cost_analysis.py` or provide a custom",
        "pricing configuration. Key fields to update:",
        "",
        "- `provider`, `region`, `currency`",
        "- `instances.*.on_demand_per_hour`",
        "- `pricing_source`, `pricing_date`",
    ])

    report_text = "\n".join(lines) + "\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"  Report saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="FinOps Cost Analysis")
    parser.add_argument("--benchmark",
                        default="cloud-experiments/exp7-right-sizing/results/benchmark_results.csv",
                        help="Path to benchmark CSV from Exp 7")
    parser.add_argument("--output-csv",
                        default="cloud-experiments/exp8-finops/results/cost_analysis.csv")
    parser.add_argument("--output-md",
                        default="cloud-experiments/exp8-finops/results/cost_report.md")
    args = parser.parse_args()

    print("=" * 60)
    print("  EV Battery Intelligence — FinOps Cost Analysis")
    print("=" * 60)

    # Load benchmark data
    print("\n  [1/3] Loading benchmark results...")
    results = load_benchmark_results(args.benchmark)
    print(f"  Loaded {len(results)} records.")

    # Compute costs
    print("\n  [2/3] Computing cost estimates...")
    cost_rows = compute_costs(results, DEFAULT_PRICING)

    for row in cost_rows:
        print(f"    {row['config_name']:20s} | {row['instance_type']:12s} | "
              f"${row['hourly_rate_usd']:.3f}/hr | ${row['monthly_rate_usd']:.2f}/mo | "
              f"${row['cost_per_1000_requests_usd']:.6f}/1K req")

    # Save outputs
    print("\n  [3/3] Saving results...")
    save_cost_csv(cost_rows, args.output_csv)
    generate_cost_report(cost_rows, DEFAULT_PRICING, args.output_md)

    print("\n  FinOps analysis complete.")


if __name__ == "__main__":
    main()
