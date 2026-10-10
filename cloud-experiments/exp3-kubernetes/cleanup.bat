@echo off
REM ──────────────────────────────────────────────────────────
REM  cleanup.bat — Remove only EV Battery experiment resources
REM ──────────────────────────────────────────────────────────

echo ============================================================
echo   Cleaning up EV Battery Kubernetes resources...
echo ============================================================

echo [STEP 1] Deleting resources in ev-battery namespace...
kubectl delete -k cloud-experiments\exp3-kubernetes\ --ignore-not-found

echo.
echo [STEP 2] Deleting namespace...
kubectl delete namespace ev-battery --ignore-not-found

echo.
echo [DONE] Cleanup complete. Other cluster resources are untouched.
echo ============================================================
