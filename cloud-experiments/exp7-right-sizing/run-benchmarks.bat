@echo off
REM ──────────────────────────────────────────────────────────
REM  run-benchmarks.bat — Run benchmarks across resource configurations
REM  Requires: backend running (Docker or direct), Python 3.10+
REM  Run from project root
REM ──────────────────────────────────────────────────────────

echo ============================================================
echo   EV Battery Intelligence — Right-Sizing Benchmarks
echo ============================================================

set URL=http://localhost:8000
set REQUESTS=100
set CONCURRENCY=5
set OUTPUT=cloud-experiments\exp7-right-sizing\results\benchmark_results.csv

REM ── Configuration 1: Over-provisioned
echo.
echo [CONFIG 1/3] Over-provisioned (mem=6Gi, cpu=6000m)
echo ──────────────────────────────────────────────────
echo NOTE: To test with over-provisioned resources, update docker-compose
echo       resource limits to mem=6Gi, cpu=6000m and restart the backend.
echo       Then run the benchmark below.
echo.
python cloud-experiments\exp7-right-sizing\benchmark.py ^
    --url %URL% ^
    --requests %REQUESTS% ^
    --concurrency %CONCURRENCY% ^
    --config-name "over-provisioned" ^
    --endpoints "soc,rul,thermal" ^
    --output %OUTPUT%

echo.
echo ──────────────────────────────────────────────────
echo   Benchmark with current configuration complete.
echo   To compare configurations:
echo     1. Change resource limits in docker-compose.yml
echo     2. Rebuild: docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d --build
echo     3. Wait for health check to pass
echo     4. Re-run with different --config-name:
echo        python cloud-experiments\exp7-right-sizing\benchmark.py --config-name "intermediate" ...
echo        python cloud-experiments\exp7-right-sizing\benchmark.py --config-name "right-sized" ...
echo     5. Run the analysis:
echo        python cloud-experiments\exp7-right-sizing\analyze.py
echo ============================================================
