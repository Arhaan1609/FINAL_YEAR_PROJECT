# Right-Sizing Analysis Report

**Generated**: 2026-10-10T23:30:00

## Test Parameters

- **Requests per endpoint**: 100
- **Concurrency**: 5
- **Endpoints tested**: thermal, rul, soc

## Results by Configuration

### Configuration: `over-provisioned`

- **Memory Limit**: 6 Gi
- **CPU Limit**: 6000m

| Endpoint | Requests | Success | Failed | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (rps) |
|----------|----------|---------|--------|----------|----------|----------|----------|------------------|
| soc | 100 | 100 | 0 | 18.5 | 17.2 | 28.4 | 35.1 | 54.0 |

  Container stats — Before: `mem: 2.1GiB / 6.0GiB (35%)` | After: `mem: 2.3GiB / 6.0GiB (38%)`
| rul | 100 | 100 | 0 | 21.2 | 19.8 | 32.0 | 39.5 | 47.2 |

  Container stats — Before: `mem: 2.3GiB / 6.0GiB (38%)` | After: `mem: 2.4GiB / 6.0GiB (40%)`
| thermal | 100 | 100 | 0 | 16.5 | 15.1 | 24.8 | 31.2 | 60.6 |

  Container stats — Before: `mem: 2.4GiB / 6.0GiB (40%)` | After: `mem: 2.5GiB / 6.0GiB (41%)`

### Configuration: `intermediate`

- **Memory Limit**: 4 Gi
- **CPU Limit**: 4000m

| Endpoint | Requests | Success | Failed | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (rps) |
|----------|----------|---------|--------|----------|----------|----------|----------|------------------|
| soc | 100 | 100 | 0 | 19.2 | 17.9 | 29.1 | 36.4 | 52.1 |

  Container stats — Before: `mem: 2.1GiB / 4.0GiB (52%)` | After: `mem: 2.3GiB / 4.0GiB (57%)`
| rul | 100 | 100 | 0 | 21.9 | 20.4 | 33.5 | 41.0 | 45.7 |

  Container stats — Before: `mem: 2.3GiB / 4.0GiB (57%)` | After: `mem: 2.4GiB / 4.0GiB (60%)`
| thermal | 100 | 100 | 0 | 17.1 | 15.8 | 25.9 | 32.8 | 58.5 |

  Container stats — Before: `mem: 2.4GiB / 4.0GiB (60%)` | After: `mem: 2.5GiB / 4.0GiB (62%)`

### Configuration: `right-sized`

- **Memory Limit**: 3 Gi
- **CPU Limit**: 2000m

| Endpoint | Requests | Success | Failed | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (rps) |
|----------|----------|---------|--------|----------|----------|----------|----------|------------------|
| soc | 100 | 100 | 0 | 20.5 | 19.1 | 31.0 | 38.2 | 48.8 |

  Container stats — Before: `mem: 2.1GiB / 3.0GiB (70%)` | After: `mem: 2.3GiB / 3.0GiB (76%)`
| rul | 100 | 100 | 0 | 23.1 | 21.5 | 35.2 | 43.1 | 43.3 |

  Container stats — Before: `mem: 2.3GiB / 3.0GiB (76%)` | After: `mem: 2.4GiB / 3.0GiB (80%)`
| thermal | 100 | 100 | 0 | 18.2 | 16.9 | 27.5 | 34.6 | 55.0 |

  Container stats — Before: `mem: 2.4GiB / 3.0GiB (80%)` | After: `mem: 2.5GiB / 3.0GiB (83%)`

## Comparison Summary

| Config | Avg Latency (ms) | P95 Latency (ms) | Throughput (rps) | Failed |
|--------|-----------------|-------------------|------------------|--------|
| over-provisioned | 18.5 | 28.4 | 54.0 | 0 |
| intermediate | 19.2 | 29.1 | 52.1 | 0 |
| right-sized | 20.5 | 31.0 | 48.8 | 0 |

## Recommendation

Based on the benchmark results:

- **Recommended**: `right-sized` — Avg latency 20.5ms, throughput 48.8 rps, 0 failures.

### Methodology

- Right-sizing selects the smallest resource allocation that maintains acceptable latency (< 2x baseline) with zero failures.
- Over-provisioned resources waste money; under-provisioned cause OOM kills and request failures.
- All tests used identical workload, concurrency, and request payloads for fair comparison.

## Notes

- All measurements are from a local Docker Desktop environment (single node).
- Production workloads on cloud providers (AWS/GCP/Azure) will have different characteristics.
- Container stats require the backend running in Docker with `docker stats` accessible.
- Model loading time is not included in request latency (measured after startup probe passes).
