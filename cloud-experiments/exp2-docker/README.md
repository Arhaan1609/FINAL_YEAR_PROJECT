# Experiment 2 — Docker and Docker Hub

## Overview

Containerization of the EV Battery Intelligence System using Docker, with Docker Hub push/pull workflow.

### Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  Frontend (3000) │────▶│  Backend  (8000) │
│  Next.js 14      │     │  FastAPI + ML     │
│  node:20-alpine  │     │  python:3.11-slim │
└──────────────────┘     └──────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.backend` | Backend image: Python 3.11 + ML models |
| `Dockerfile.frontend` | Frontend image: Next.js multi-stage build |
| `docker-compose.yml` | Orchestration with health checks & resource limits |
| `.dockerignore` | Excludes secrets, caches, git, large data |
| `build-and-run.bat` | Automated build, run, validate (Windows) |

## Prerequisites

```powershell
docker info
docker compose version
```

## Quick Start

### 1. Build & Run (automated)

```powershell
# From project root
cloud-experiments\exp2-docker\build-and-run.bat
```

### 2. Build & Run (manual)

```powershell
# Build images (BuildKit automatically uses Dockerfile.*.dockerignore)
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml build

# Start services
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d

# Watch logs
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml logs -f
```

### 3. Validate

```powershell
# Health check
curl http://localhost:8000/health

# API root
curl http://localhost:8000/

# API docs
start http://localhost:8000/docs

# Frontend
start http://localhost:3000
```

### 4. View Logs

```powershell
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml logs backend
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml logs frontend
```

### 5. Stop

```powershell
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml down
```

## Docker Hub Workflow

### Tag Images

```powershell
# Set your Docker Hub username
set DOCKERHUB_USER=your-username

# Tag
docker tag evbattery/ev-battery-backend:latest %DOCKERHUB_USER%/ev-battery-backend:latest
docker tag evbattery/ev-battery-frontend:latest %DOCKERHUB_USER%/ev-battery-frontend:latest
```

### Login & Push

```powershell
# Login (enter credentials interactively — never store in files)
docker login

# Push
docker push %DOCKERHUB_USER%/ev-battery-backend:latest
docker push %DOCKERHUB_USER%/ev-battery-frontend:latest
```

### Pull & Run (from another machine)

```powershell
docker pull %DOCKERHUB_USER%/ev-battery-backend:latest
docker pull %DOCKERHUB_USER%/ev-battery-frontend:latest

# Run backend
docker run -d -p 8000:8000 --name ev-backend %DOCKERHUB_USER%/ev-battery-backend:latest

# Run frontend (after backend is healthy)
docker run -d -p 3000:3000 --name ev-frontend %DOCKERHUB_USER%/ev-battery-frontend:latest
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKERHUB_USER` | `evbattery` | Docker Hub username for image tags |
| `BACKEND_PORT` | `8000` | Host port for backend |
| `FRONTEND_PORT` | `3000` | Host port for frontend |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend URL baked into frontend at build time |

## Resource Limits

| Service | Memory Limit | CPU Limit | Memory Reserved |
|---------|-------------|-----------|-----------------|
| Backend | 4 GB | 4 cores | 2 GB |
| Frontend | 512 MB | 1 core | 256 MB |

## Notes

- Backend startup takes ~60-120 seconds due to ML model loading (TensorFlow, PyTorch, XGBoost).
- The health check has a `start_period` of 120s to accommodate model loading.
- The `.dockerignore` excludes `data/raw/` and `data/processed/` (large datasets not needed at runtime).
- No credentials are stored in any file — `docker login` is always interactive.

## Known Blockers

- **Frontend hardcoded URLs**: Some frontend components have hardcoded `localhost:8000` links (e.g., in landing page). These are display-only links and don't affect API connectivity, which uses the configurable `NEXT_PUBLIC_API_BASE_URL` env var.
