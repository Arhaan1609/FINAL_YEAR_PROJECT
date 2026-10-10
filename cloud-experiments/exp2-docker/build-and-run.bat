@echo off
REM ──────────────────────────────────────────────────────────
REM  build-and-run.bat — Build, run, validate EV Battery containers
REM  Run from project root
REM ──────────────────────────────────────────────────────────

echo ============================================================
echo   EV Battery Intelligence — Docker Build ^& Run
echo ============================================================

REM ── Step 1: Pre-flight check (Docker BuildKit uses Dockerfile.*.dockerignore automatically)
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM ── Step 2: Build images
echo.
echo [STEP 1/4] Building Docker images...
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed.
    exit /b 1
)
echo [OK] Images built successfully.

REM ── Step 3: Start containers
echo.
echo [STEP 2/4] Starting containers...
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml up -d
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start containers.
    exit /b 1
)

REM ── Step 4: Wait for backend health
echo.
echo [STEP 3/4] Waiting for backend health check (may take 2 minutes for model loading)...
set ATTEMPTS=0
:healthloop
set /a ATTEMPTS+=1
if %ATTEMPTS% gtr 24 (
    echo [WARNING] Backend did not become healthy after 2 minutes.
    echo [INFO] Check logs: docker compose -f cloud-experiments\exp2-docker\docker-compose.yml logs backend
    goto show_status
)
timeout /t 5 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:8000/health | findstr "200" >nul
if %ERRORLEVEL% neq 0 goto healthloop
echo [OK] Backend is healthy!

REM ── Step 5: Validate
:show_status
echo.
echo [STEP 4/4] Validation...
echo.
echo --- Backend Health ---
curl -s http://localhost:8000/health
echo.
echo --- Backend Root ---
curl -s http://localhost:8000/
echo.
echo --- Container Status ---
docker compose -f cloud-experiments\exp2-docker\docker-compose.yml ps
echo.
echo ============================================================
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   Logs:      docker compose -f cloud-experiments\exp2-docker\docker-compose.yml logs -f
echo   Stop:      docker compose -f cloud-experiments\exp2-docker\docker-compose.yml down
echo ============================================================
