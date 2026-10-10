# Experiment 3 — Kubernetes Deployment

## Overview

Deploy the EV Battery Intelligence System to the local `docker-desktop` Kubernetes cluster using the Docker images from Experiment 2.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 docker-desktop cluster                   │
│                 Namespace: ev-battery                    │
│                                                          │
│  ┌────────────────────┐    ┌────────────────────┐       │
│  │ Deployment:        │    │ Deployment:        │       │
│  │ ev-battery-backend │    │ ev-battery-frontend│       │
│  │ (1 replica)        │    │ (1 replica)        │       │
│  └────────┬───────────┘    └────────┬───────────┘       │
│           │                         │                    │
│  ┌────────▼───────────┐    ┌────────▼───────────┐       │
│  │ Service: NodePort  │    │ Service: NodePort  │       │
│  │ 30800 → 8000       │    │ 30300 → 3000       │       │
│  └────────────────────┘    └────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. Docker images built (Experiment 2):
   ```powershell
   docker images | findstr "ev-battery"
   ```
2. Kubernetes context set to `docker-desktop`:
   ```powershell
   kubectl config current-context
   kubectl get nodes
   ```

## Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates `ev-battery` namespace |
| `configmap.yaml` | Shared configuration (env vars) |
| `backend-deployment.yaml` | Backend Deployment with probes & resource limits |
| `backend-service.yaml` | Backend NodePort Service (30800) |
| `frontend-deployment.yaml` | Frontend Deployment with probes |
| `frontend-service.yaml` | Frontend NodePort Service (30300) |
| `kustomization.yaml` | Kustomize aggregation |
| `deploy.bat` | Automated deployment script |
| `cleanup.bat` | Safe cleanup (experiment resources only) |

## Quick Deploy

```powershell
# From project root — automated
cloud-experiments\exp3-kubernetes\deploy.bat
```

## Manual Deployment

### 1. Apply Manifests

```powershell
kubectl apply -k cloud-experiments\exp3-kubernetes\
```

### 2. Monitor Rollout

```powershell
kubectl rollout status deployment/ev-battery-backend -n ev-battery --timeout=300s
kubectl rollout status deployment/ev-battery-frontend -n ev-battery --timeout=120s
```

### 3. Verify

```powershell
# Pods
kubectl get pods -n ev-battery -o wide

# Services
kubectl get svc -n ev-battery

# Backend logs
kubectl logs -f deployment/ev-battery-backend -n ev-battery

# Health check
curl http://localhost:30800/health

# API docs
start http://localhost:30800/docs

# Frontend
start http://localhost:30300
```

### 4. Inspect Events & Describe

```powershell
kubectl get events -n ev-battery --sort-by='.lastTimestamp'
kubectl describe deployment ev-battery-backend -n ev-battery
kubectl describe pod -l app=ev-battery-backend -n ev-battery
```

## Scaling

### Scale backend to 3 replicas

```powershell
kubectl scale deployment ev-battery-backend -n ev-battery --replicas=3

# Verify
kubectl get pods -n ev-battery -l app=ev-battery-backend
```

> **Note**: 3 replicas on a single `docker-desktop` node do NOT provide multi-node high availability.
> This only demonstrates horizontal pod scaling. Each replica loads all ML models (~2+ GB RAM).
> Ensure Docker Desktop has sufficient memory allocated (recommended ≥ 8 GB for 3 replicas).

### Scale back to 1

```powershell
kubectl scale deployment ev-battery-backend -n ev-battery --replicas=1
```

## Cleanup

```powershell
# Automated — removes only experiment resources
cloud-experiments\exp3-kubernetes\cleanup.bat

# Manual
kubectl delete -k cloud-experiments\exp3-kubernetes\ --ignore-not-found
kubectl delete namespace ev-battery --ignore-not-found
```

## Resource Configuration

| Component | Memory Request | Memory Limit | CPU Request | CPU Limit |
|-----------|---------------|-------------|-------------|-----------|
| Backend | 2 Gi | 4 Gi | 1000m | 4000m |
| Frontend | 256 Mi | 512 Mi | 250m | 1000m |

## Secrets

No secrets are stored in YAML manifests. If API keys are needed (e.g., for the Copilot service), create a Kubernetes Secret manually:

```powershell
kubectl create secret generic ev-battery-secrets -n ev-battery --from-literal=API_KEY=your-key-here
```

Then reference it in the deployment's `envFrom` field.

## Known Blockers

- **Frontend API URL**: The frontend's `NEXT_PUBLIC_API_BASE_URL` is baked in at Docker build time. In the current build, it points to `http://localhost:8000`. When accessing the frontend via Kubernetes (port 30300), browser-side API calls go to `localhost:8000`, which works if the backend Docker Compose or port-forward is also running on port 8000. For Kubernetes NodePort (30800), the frontend image would need to be rebuilt with `NEXT_PUBLIC_API_BASE_URL=http://localhost:30800`. This is a limitation of Next.js build-time env injection—cannot be changed without rebuilding. **Workaround**: Use port-forward to map 8000 to the K8s backend:
  ```powershell
  kubectl port-forward svc/ev-battery-backend -n ev-battery 8000:8000
  ```
- **Metrics Server**: `kubectl top pods` requires metrics-server, which is not installed by default on docker-desktop. Resource usage can be observed via Docker Desktop dashboard instead.
