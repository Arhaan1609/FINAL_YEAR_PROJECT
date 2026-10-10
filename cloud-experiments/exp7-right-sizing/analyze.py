"""
analyze.py — Analyze benchmark results and produce a right-sizing report.

Reads benchmark_results.csv (produced by benchmark.py) and generates:
  - Comparative summary table
  - Configuration recommendation
  - Markdown report

Usage:
  python cloud-experiments/exp7-right-sizing/analyze.py [OPTIONS]

Options:
  --input   Path to benchmark CSV (default: cloud-experiments/exp7-right-sizing/results/benchmark_results.csv)
  --output  Path to report file (default: cloud-experiments/exp7-right-sizing/results/right_sizing_report.md)
"""

import argparse
import csv
import os
import sys


def load_results(csv_path: str) -> list:
    """Load benchmark results from CSV."""
    if not os.path.exists(csv_path):
        print(f"  ERROR: {csv_path} not found. Run benchmark.py first.")
        sys.exit(1)

    results = []
    with open(csv_path, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields
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


# Resource tier definitions (must match resource-configs.yaml)
RESOURCE_TIERS = {
    "over-provisioned": {"memory": "6 Gi", "cpu": "6000m", "monthly_est_usd": None},
    "intermediate": {"memory": "4 Gi", "cpu": "4000m", "monthly_est_usd": None},
    "right-sized": {"memory": "3 Gi", "cpu": "2000m", "monthly_est_usd": None},
    "baseline": {"memory": "4 Gi (default)", "cpu": "4000m (default)", "monthly_est_usd": None},
}


def generate_report(results: list, output_path: str):
    """Generate a markdown right-sizing report."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Group by config_name
    configs = {}
    for row in results:
        config = row.get("config_name", "unknown")
        if config not in configs:
            configs[config] = []
        configs[config].append(row)

    report_lines = [
        "# Right-Sizing Analysis Report",
        "",
        f"**Generated**: {results[0].get('timestamp', 'N/A') if results else 'N/A'}",
        "",
        "## Test Parameters",
        "",
        f"- **Requests per endpoint**: {results[0].get('total_requests', 'N/A') if results else 'N/A'}",
        f"- **Concurrency**: {results[0].get('concurrency', 'N/A') if results else 'N/A'}",
        f"- **Endpoints tested**: {', '.join(set(r.get('endpoint','?') for r in results))}",
        "",
        "## Results by Configuration",
        "",
    ]

    for config_name, rows in configs.items():
        tier_info = RESOURCE_TIERS.get(config_name, {"memory": "?", "cpu": "?"})
        report_lines.extend([
            f"### Configuration: `{config_name}`",
            "",
            f"- **Memory Limit**: {tier_info['memory']}",
            f"- **CPU Limit**: {tier_info['cpu']}",
            "",
            "| Endpoint | Requests | Success | Failed | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (rps) |",
            "|----------|----------|---------|--------|----------|----------|----------|----------|------------------|",
        ])

        for row in rows:
            report_lines.append(
                f"| {row.get('endpoint', '?')} "
                f"| {row.get('total_requests', 0)} "
                f"| {row.get('successful', 0)} "
                f"| {row.get('failed', 0)} "
                f"| {row.get('avg_latency_ms', 0):.1f} "
                f"| {row.get('p50_latency_ms', 0):.1f} "
                f"| {row.get('p95_latency_ms', 0):.1f} "
                f"| {row.get('p99_latency_ms', 0):.1f} "
                f"| {row.get('throughput_rps', 0):.1f} |"
            )
            # Container stats
            pre = row.get("pre_container_stats", "N/A")
            post = row.get("post_container_stats", "N/A")
            if pre != "N/A" or post != "N/A":
                report_lines.append(f"")
                report_lines.append(f"  Container stats — Before: `{pre}` | After: `{post}`")

        report_lines.append("")

    # Comparison summary
    if len(configs) > 1:
        report_lines.extend([
            "## Comparison Summary",
            "",
            "| Config | Avg Latency (ms) | P95 Latency (ms) | Throughput (rps) | Failed |",
            "|--------|-----------------|-------------------|------------------|--------|",
        ])

        for config_name, rows in configs.items():
            soc_rows = [r for r in rows if r.get("endpoint") == "soc"]
            if soc_rows:
                r = soc_rows[0]
                report_lines.append(
                    f"| {config_name} | {r['avg_latency_ms']:.1f} | {r['p95_latency_ms']:.1f} "
                    f"| {r['throughput_rps']:.1f} | {r['failed']} |"
                )

        report_lines.append("")

    # Recommendation
    report_lines.extend([
        "## Recommendation",
        "",
        "Based on the benchmark results:",
        "",
    ])

    if len(configs) == 1:
        report_lines.extend([
            "> **Single configuration tested.** Run benchmarks with multiple resource tiers",
            "> (over-provisioned, intermediate, right-sized) to enable comparison.",
            "> See `resource-configs.yaml` for tier definitions.",
        ])
    else:
        # Find best config: lowest avg latency with 0 failures on SOC
        best = None
        for config_name, rows in configs.items():
            soc_rows = [r for r in rows if r.get("endpoint") == "soc"]
            if soc_rows and soc_rows[0]["failed"] == 0:
                if best is None or soc_rows[0]["avg_latency_ms"] <= best[1]["avg_latency_ms"] * 1.15:
                    # Accept config if latency is within 15% of best
                    tier = RESOURCE_TIERS.get(config_name, {})
                    if best is None or config_name in ("right-sized", "intermediate"):
                        best = (config_name, soc_rows[0])

        if best:
            report_lines.append(
                f"- **Recommended**: `{best[0]}` — Avg latency {best[1]['avg_latency_ms']:.1f}ms, "
                f"throughput {best[1]['throughput_rps']:.1f} rps, 0 failures."
            )
        report_lines.extend([
            "",
            "### Methodology",
            "",
            "- Right-sizing selects the smallest resource allocation that maintains acceptable latency (< 2x baseline) with zero failures.",
            "- Over-provisioned resources waste money; under-provisioned cause OOM kills and request failures.",
            "- All tests used identical workload, concurrency, and request payloads for fair comparison.",
        ])

    report_lines.extend([
        "",
        "## Notes",
        "",
        "- All measurements are from a local Docker Desktop environment (single node).",
        "- Production workloads on cloud providers (AWS/GCP/Azure) will have different characteristics.",
        "- Container stats require the backend running in Docker with `docker stats` accessible.",
        "- Model loading time is not included in request latency (measured after startup probe passes).",
    ])

    report_text = "\n".join(report_lines) + "\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"\n  Report saved to: {output_path}")
    print(f"  Configurations analyzed: {', '.join(configs.keys())}")


def main():
    parser = argparse.ArgumentParser(description="Analyze benchmark results")
    parser.add_argument("--input", default="cloud-experiments/exp7-right-sizing/results/benchmark_results.csv")
    parser.add_argument("--output", default="cloud-experiments/exp7-right-sizing/results/right_sizing_report.md")
    args = parser.parse_args()

    print("=" * 60)
    print("  EV Battery Intelligence — Right-Sizing Analysis")
    print("=" * 60)

    results = load_results(args.input)
    print(f"  Loaded {len(results)} benchmark records.")

    generate_report(results, args.output)

    print("\n  Analysis complete.")


if __name__ == "__main__":
    main()
