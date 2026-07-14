# SocialBook API — Benchmark Results

> **Date**: 2026-06-02
> **Environment**: Local / Staging / Production
> **API URL**: `http://localhost:5000/api`
> **Tool**: [k6](https://k6.io) v0.x

---

## Test Scenarios

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| Warm up | Ramp from 0 → 10 users | 10 | 10s |
| Ramp up | Ramp from 10 → 50 users | 50 | 20s |
| Stress | Hold at 100 users | 100 | 30s |
| Cool down | Ramp to 0 | — | 10s |

---

## Results

### 1. Books List API (`GET /api/books`)

| Metric | Value |
|--------|-------|
| Avg response time | — |
| P50 | — |
| **P95** | **—** |
| P99 | — |
| Max | — |
| Success rate | — % |

### 2. Book Detail API (`GET /api/books/:slug`)

| Metric | Value |
|--------|-------|
| Avg response time | — |
| P50 | — |
| **P95** | **—** |
| P99 | — |
| Max | — |
| Cache hit ratio (Redis) | — % |

### 3. Book Search (`GET /api/books?search=...`)

| Metric | Value |
|--------|-------|
| Avg response time | — |
| P50 | — |
| **P95** | **—** |
| P99 | — |
| Max | — |

---

## Analysis

### Bottlenecks Found

1. **...** — ...
2. **...** — ...

### Optimizations Applied

| # | Issue | Before | After | Improvement |
|---|-------|--------|-------|-------------|
| 1 | No Redis cache for book detail | ~800ms P95 | ~50ms P95 | **16x** |
| 2 | Missing compound index | ~1200ms P95 | ~80ms P95 | **15x** |
| 3 | — | — | — | — |

---

## How to Run

```bash
# Install k6
winget install k6

# Run benchmark
cd benchmark
./run-all.bat

# View HTML report
k6 report benchmark-results.json
```

---

## System Specs

| Component | Spec |
|-----------|------|
| CPU | — |
| RAM | — |
| Node | v20.x |
| MongoDB | 7.x |
| Redis | 7.x |
| Network | Localhost / Docker |
