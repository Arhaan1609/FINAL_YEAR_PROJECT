# FinOps Cost Analysis Report — EV Battery Intelligence

## Pricing Assumptions

| Parameter | Value |
|-----------|-------|
| Cloud Provider | AWS |
| Region | us-east-1 (N. Virginia) |
| Currency | USD |
| Pricing Source | AWS EC2 On-Demand Pricing (public page) |
| Pricing Date | 2026-10-01 |
| Hours/Month | 730 |

> **⚠️ IMPORTANT**: ESTIMATED prices — verify against current AWS pricing page before use.

## Cost Comparison

### Per-Instance Pricing

| Configuration | Instance | vCPU | RAM (GB) | $/Hour | $/Month |
|---------------|----------|------|----------|--------|---------|
| over-provisioned | m6i.2xlarge | 8 | 32 | $0.384 | $280.32 |
| intermediate | m6i.xlarge | 4 | 16 | $0.192 | $140.16 |
| right-sized | m6i.large | 2 | 8 | $0.096 | $70.08 |

### Performance vs. Cost

| Configuration | Avg Latency (ms) | P95 (ms) | Throughput (rps) | Failures | $/1K Requests |
|---------------|-----------------|----------|------------------|----------|---------------|
| over-provisioned | 18.5 | 28.4 | 54.0 | 0 | $0.001974 |
| intermediate | 19.2 | 29.1 | 52.1 | 0 | $0.001024 |
| right-sized | 20.5 | 31.0 | 48.8 | 0 | $0.000547 |

### Potential Monthly Savings

| Comparison | Monthly Savings | Percentage |
|------------|----------------|------------|
| over-provisioned → right-sized | $210.24/month | 75.0% |

## Recommendation

**Recommended configuration: `right-sized`**

- Instance: m6i.large (2 vCPU, 8 GB)
- Monthly cost: $70.08
- Average latency: 20.5 ms
- Throughput: 48.8 rps
- Zero failed requests

This is the least expensive configuration that satisfies performance requirements
(zero failures, acceptable latency).

## Important Disclaimers

1. **Estimated pricing**: Costs are based on published on-demand pricing. Actual bills
   may differ due to reserved instances, savings plans, spot pricing, and data transfer.
2. **Short-run vs. continuous**: Cost-per-run reflects compute time for a benchmark.
   Monthly cost assumes the instance runs 24/7 (730 hours/month).
3. **Compute only**: Pricing does not include storage (EBS), data transfer, load balancers,
   monitoring, or other AWS services.
4. **Local benchmark**: Performance was measured on Docker Desktop. Cloud instances will
   have different CPU/memory/network characteristics.
5. **Single-service pricing**: Costs are for the backend only. Frontend hosting
   (e.g., Vercel, S3+CloudFront) would add additional cost.

## How to Update Pricing

Edit the `DEFAULT_PRICING` dictionary in `cost_analysis.py` or provide a custom
pricing configuration. Key fields to update:

- `provider`, `region`, `currency`
- `instances.*.on_demand_per_hour`
- `pricing_source`, `pricing_date`
