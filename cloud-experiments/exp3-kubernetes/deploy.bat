@echo off
REM ──────────────────────────────────────────────────────────
REM  deploy.bat — Deploy EV Battery to docker-desktop Kubernetes
REM  Run from project root
REM ──────────────────────────────────────────────────────────

echo ============================================================
echo   EV Battery Intelligence — Kubernetes Deployment
echo ============================================================

REM ── Verify context
echo.
echo [CHECK] Kubernetes context:
kubectl config current-context
kubectl get nodes

REM ── Apply manifests via Kustomize
echo.
echo [STEP 1] Applying Kubernetes manifests...
kubectl apply -k cloud-experiments\exp3-kubernetes\
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to apply manifests.
    exit /b 1
)

REM ── Wait for backend rollout
echo.
echo [STEP 2] Waiting for backend deployment (may take 3-5 minutes for model loading)...
kubectl rollout status deployment/ev-battery-backend -n ev-battery --timeout=300s

REM ── Wait for frontend rollout
echo.
echo [STEP 3] Waiting for frontend deployment...
kubectl rollout status deployment/ev-battery-frontend -n ev-battery --timeout=120s

REM ── Show status
echo.
echo [STEP 4] Cluster status:
echo.
echo --- Pods ---
kubectl get pods -n ev-battery -o wide
echo.
echo --- Services ---
kubectl get svc -n ev-battery
echo.
echo --- Deployments ---
kubectl get deployments -n ev-battery
echo.
echo --- Events (last 10) ---
powershell -NoProfile -Command "kubectl get events -n ev-battery --sort-by='.lastTimestamp' | Select-Object -Last 10"

echo.
echo ============================================================
echo   Backend:   http://localhost:30800
echo   Frontend:  http://localhost:30300
echo   API Docs:  http://localhost:30800/docs
echo   Health:    http://localhost:30800/health
echo ============================================================
echo.
echo Useful commands:
echo   kubectl logs -f deployment/ev-battery-backend -n ev-battery
echo   kubectl logs -f deployment/ev-battery-frontend -n ev-battery
echo   kubectl describe pod -l app=ev-battery-backend -n ev-battery
echo   kubectl top pods -n ev-battery   (requires metrics-server)
echo ============================================================
