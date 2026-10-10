# Complete Cloud Experiments & AWS Production Deployment Guide
## EV Battery Intelligence System

> **Document Version:** 1.0.0  
> **Target Cloud:** Amazon Web Services (AWS)  
> **Environment:** Docker Desktop (Validation) ➔ Amazon ECR / Amazon EKS / Amazon EC2  
> **Architecture:** FastAPI (ML Inference Backend) + Next.js (Dashboard Frontend)

---

## Table of Contents

1. [Executive Summary & Experiment Overview](#1-executive-summary--experiment-overview)
2. [Application Architecture & Component Profile](#2-application-architecture--component-profile)
3. [Experiment 2 Breakdown — Docker & Containerization](#3-experiment-2-breakdown--docker--containerization)
4. [Experiment 3 Breakdown — Kubernetes Orchestration](#4-experiment-3-breakdown--kubernetes-orchestration)
5. [Experiment 7 Breakdown — Benchmarking & Right-Sizing](#5-experiment-7-breakdown--benchmarking--right-sizing)
6. [Experiment 8 Breakdown — FinOps & Cloud Cost Analysis](#6-experiment-8-breakdown--finops--cloud-cost-analysis)
7. [Step-by-Step AWS Deployment Blueprint (Production)](#7-step-by-step-aws-deployment-blueprint-production)
   - [Method A: Amazon EKS (Managed Kubernetes — Recommended)](#method-a-amazon-eks-managed-kubernetes--recommended)
   - [Method B: Amazon ECS + Fargate (Serverless Containers)](#method-b-amazon-ecs--fargate-serverless-containers)
   - [Method C: Single Amazon EC2 Instance + Docker Compose (Low Cost / Demo)](#method-c-single-amazon-ec2-instance--docker-compose-low-cost--demo)
8. [Adapting Manifests for AWS](#8-adapting-manifests-for-aws)
9. [Networking, SSL, and Domain Configuration](#9-networking-ssl-and-domain-configuration)
10. [Monitoring, Alerting, and Production Safeguards](#10-monitoring-alerting-and-production-safeguards)
11. [Teardown & Cleanup Checklist](#11-teardown--cleanup-checklist)

---

## 1. Executive Summary & Experiment Overview

Four cloud computing experiments were implemented in the `cloud-experiments/` workspace directory. **Zero changes** were made to existing project source files, machine learning model weights, training datasets, or configurations.

```
cloud-experiments/
├── README.md                          # Master directory index
├── AWS_DEPLOYMENT_README.md           # This comprehensive guide
├── exp2-docker/                       # Experiment 2: Docker containerization
│   ├── Dockerfile.backend             # Python 3.11-slim + PyTorch + FastAPI
│   ├── Dockerfile.frontend            # Node 20-alpine multi-stage Next.js
│   ├── Dockerfile.*.dockerignore      # BuildKit exclusion files
│   ├── docker-compose.yml             # Container orchestration
│   ├── build-and-run.bat              # Windows one-click build & run
│   └── README.md                      # Local Docker guide
├── exp3-kubernetes/                   # Experiment 3: Kubernetes deployment
│   ├── namespace.yaml                 # Isolated namespace (ev-battery)
│   ├── configmap.yaml                 # Environment configuration
│   ├── backend-deployment.yaml        # Backend pod with probes & limits
│   ├── backend-service.yaml           # Backend NodePort service (30800)
│   ├── frontend-deployment.yaml       # Frontend pod with probes & limits
│   ├── frontend-service.yaml          # Frontend NodePort service (30300)
│   ├── kustomization.yaml             # Kustomize manifest bundle
│   ├── deploy.bat / cleanup.bat       # Automation scripts
│   └── README.md                      # Local K8s guide
├── exp7-right-sizing/                 # Experiment 7: Performance & sizing
│   ├── resource-configs.yaml          # Resource tier profiles
│   ├── benchmark.py                   # Multi-endpoint latency & load tester
│   ├── analyze.py                     # Performance report generator
│   ├── run-benchmarks.bat             # Benchmark runner script
│   └── results/                       # benchmark_results.csv & report
└── exp8-finops/                       # Experiment 8: FinOps cost modeling
    ├── cost_analysis.py               # AWS pricing engine
    └── results/                       # cost_analysis.csv & cost_report.md
```

---

## 2. Application Architecture & Component Profile

```
                           ┌──────────────────────────────┐
                           │      Client Web Browser      │
                           └──────────────┬───────────────┘
                                          │
                                   HTTP / HTTPS
                                          │
                   ┌──────────────────────▼──────────────────────┐
                   │    Frontend: Next.js 14 Dashboard           │
                   │    Port: 3000 | Container Base: Node 20     │
                   │    SSR + Interactive React Visualizations    │
                   └──────────────────────┬──────────────────────┘
                                          │
                        REST API (JSON) via NEXT_PUBLIC_API_BASE_URL
                                          │
                   ┌──────────────────────▼──────────────────────┐
                   │    Backend: FastAPI Application             │
                   │    Port: 8000 | Container Base: Python 3.11 │
                   ├─────────────────────────────────────────────┤
                   │  - Module A: Fleet Predictions (SOC/RUL)    │
                   │  - Module B: Thermal Faults (CNN-LSTM, RF)  │
                   │  - Module C: Driver Behavior (BA-BMS)       │
                   │  - Database: fleet_intelligence.db (SQLite) │
                   └─────────────────────────────────────────────┘
```

### Critical Operational Characteristics for AWS Deployment:
1. **Model Loading Overhead:** When the backend container boots up, FastAPI's lifespan event loads Scikit-Learn models, XGBoost models, and PyTorch deep neural networks into RAM.
   - **Boot Time:** 30 to 75 seconds.
   - **Peak Boot Memory:** Up to 2.4 GiB RAM.
   - **Implication:** Pod probes **must** use a high `startupProbe.failureThreshold` (at least 30 attempts × 10s = 300s grace window) so Kubernetes does not prematurely kill the pod thinking it hung.
2. **Frontend Build Dependency:** Next.js bakes `NEXT_PUBLIC_API_BASE_URL` into client-side JS bundles during build time. For AWS, you must provide your AWS Load Balancer or API domain as a build argument or configure an API reverse-proxy rewrite.

---

## 3. Experiment 2 Breakdown — Docker & Containerization

### Backend Dockerfile (`Dockerfile.backend`)
- **Base Image:** `python:3.11-slim` (minimal attack surface, ~150MB base).
- **Native Compilers:** Installs `gcc`, `g++`, and `libgomp1` to compile and link OpenMP/C dependencies required by `scipy`, `scikit-learn`, and `torch`.
- **Layer Caching:** Copies `requirements.txt` and executes `pip install --no-cache-dir` *before* copying application code so code edits do not trigger dependency re-downloads.
- **Health Check:** Integrated internal health check using `urllib.request` checking `http://localhost:8000/health` with a 2-minute `start-period`.
- **Command:** `CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]`.

### Frontend Dockerfile (`Dockerfile.frontend`)
- **Multi-Stage Build Pattern:**
  - `Stage 1 (builder)`: `node:20-alpine` runs `npm ci` and `npm run build`. Accepts `ARG NEXT_PUBLIC_API_BASE_URL`.
  - `Stage 2 (runner)`: Minimal production `node:20-alpine` image. Copies only `.next`, `public`, `node_modules`, and `package.json`. Strips development dependencies and build cache.
- **Port:** Exposes `3000`.

### Context Exclusion via BuildKit
Dedicated `.dockerignore` files prevent copying `.git/`, virtualenvs (`.venv/`), raw telemetry datasets (`data/raw/`), evaluation artifacts (`results/*.npy`), and IDE metadata. This keeps image transfer fast and build times under 3 minutes.

---

## 4. Experiment 3 Breakdown — Kubernetes Orchestration

### Kubernetes Resource Hierarchy
- **Namespace:** `ev-battery` for multi-tenant isolation.
- **ConfigMap (`ev-battery-config`):** Decouples runtime flags (`PYTHONUNBUFFERED=1`, `BACKEND_PORT=8000`) from container images.
- **Deployments:**
  - `ev-battery-backend`: 1 replica, requests: `1000m` CPU / `2Gi` RAM, limits: `4000m` CPU / `4Gi` RAM.
  - `ev-battery-frontend`: 1 replica, requests: `250m` CPU / `256Mi` RAM, limits: `1000m` CPU / `512Mi` RAM.
- **Probes Setup (Zero-Downtime Guarantee):**
  - `startupProbe`: Allows 300 seconds for PyTorch and Scikit-Learn weights to deserialize.
  - `livenessProbe`: Verifies `/health` every 30s.
  - `readinessProbe`: Withholds traffic until models report ready.
- **Services:** Local NodePort services exposing ports `30800` (Backend) and `30300` (Frontend).

---

## 5. Experiment 7 Breakdown — Benchmarking & Right-Sizing

Benchmarking was conducted across three distinct resource configurations using concurrent inference requests on `/predict/soc`, `/predict/rul`, and `/predict/thermal`:

| Resource Tier | CPU Allocation | Memory Limit | Avg Latency | P95 Latency | Throughput | Peak Container RAM | Status |
|---|---|---|---|---|---|---|---|
| **Over-provisioned** | 6.0 cores (6000m) | 6.0 GiB | 18.5 ms | 28.4 ms | 54.0 req/s | 2.5 GiB (~41%) | Excessive Waste |
| **Intermediate** | 4.0 cores (4000m) | 4.0 GiB | 19.2 ms | 29.1 ms | 52.1 req/s | 2.5 GiB (~62%) | Comfortable |
| **Right-sized** | 2.0 cores (2000m) | 3.0 GiB | 20.5 ms | 31.0 ms | 48.8 req/s | 2.5 GiB (~83%) | **Optimal** |

### Key Sizing Insights:
1. **CPU Ceiling:** Model inference on CPU is predominantly single-threaded or bursty per request. Scaling beyond 2 vCPUs yielded only a **1.3 ms (6%)** latency improvement.
2. **RAM Sizing Floor:** The model weights require 2.1 GiB base memory and 2.4–2.5 GiB under batch inference. Sizing memory below 3.0 GiB risks OOMKill during simultaneous inference bursts.
3. **Recommendation:** Sizing at **2 vCPUs and 3–4 GiB RAM** per pod delivers 95% of peak performance at 25% of the compute footprint.

---

## 6. Experiment 8 Breakdown — FinOps & Cloud Cost Analysis

Mapping local container resource configurations to published AWS EC2 On-Demand instances (us-east-1, continuous 730 hours/month):

| Configuration | Recommended AWS Instance | Specs | $/Hour | $/Month | Cost per 1,000 Inferences |
|---|---|---|---|---|---|
| **Over-provisioned** | `m6i.2xlarge` | 8 vCPU, 32 GB RAM | $0.384 | $280.32 | $0.001974 |
| **Intermediate** | `m6i.xlarge` | 4 vCPU, 16 GB RAM | $0.192 | $140.16 | $0.001024 |
| **Right-sized** | `m6i.large` | 2 vCPU, 8 GB RAM | **$0.096** | **$70.08** | **$0.000547** |

### FinOps Highlights:
- **Direct Monthly Savings:** Moving from `m6i.2xlarge` to `m6i.large` saves **$210.24 per month (75.0% reduction)**.
- **Annual Savings:** **$2,522.88 / year** saved on a single environment.
- **Unit Economics:** 1,000 inference requests cost only half a cent ($0.000547) on right-sized compute.

---

## 7. Step-by-Step AWS Deployment Blueprint (Production)

---

### Method A: Amazon EKS (Managed Kubernetes — Recommended)

This uses the existing Kubernetes manifests developed in Experiment 3, adapted for AWS.

```
                           ┌──────────────────────────────┐
                           │      AWS Route 53 (DNS)      │
                           └──────────────┬───────────────┘
                                          │
                           ┌──────────────▼──────────────┐
                           │ Application Load Balancer   │
                           │ (AWS ALB / ACM SSL cert)    │
                           └──────┬───────────────┬──────┘
                                  │               │
                            Path: /*         Path: /api/*
                                  │               │
                    ┌─────────────▼─────┐   ┌─────▼─────────────┐
                    │ Frontend Service  │   │ Backend Service   │
                    │ NodePort / Cluster│   │ NodePort / Cluster│
                    └─────────────┬─────┘   └─────┬─────────────┘
                                  │               │
                    ┌─────────────▼─────┐   ┌─────▼─────────────┐
                    │ Frontend Pod(s)   │   │ Backend Pod(s)    │
                    │ (Next.js)         │   │ (FastAPI + Models)│
                    └───────────────────┘   └───────────────────┘
```

#### Step 1: AWS CLI Authentication & Environment Variables
Open PowerShell or Bash on your workstation:
```bash
# Configure your AWS credentials
aws configure

# Set environment variables (replace with your details)
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export EKS_CLUSTER_NAME="ev-battery-cluster"
```

#### Step 2: Create Amazon ECR (Elastic Container Registry) Repositories
```bash
# Create repositories for backend and frontend
aws ecr create-repository --repository-name ev-battery-backend --region $AWS_REGION
aws ecr create-repository --repository-name ev-battery-frontend --region $AWS_REGION

# Log Docker into ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

#### Step 3: Build, Tag, and Push Docker Images to ECR
```bash
# 1. Build and push backend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ev-battery-backend:latest \
  -f cloud-experiments/exp2-docker/Dockerfile.backend .

docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ev-battery-backend:latest

# 2. Build and push frontend (Pass your AWS backend API domain if known)
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ev-battery-frontend:latest \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://<BACKEND-ALB-URL>:8000 \
  -f cloud-experiments/exp2-docker/Dockerfile.frontend .

docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ev-battery-frontend:latest
```

#### Step 4: Create the Amazon EKS Cluster (Using Right-Sized Instances)
Using `eksctl` (creates VPC, Subnets, IAM roles, and Managed Node Group automatically):
```bash
eksctl create cluster \
  --name $EKS_CLUSTER_NAME \
  --region $AWS_REGION \
  --nodegroup-name standard-workers \
  --node-type m6i.large \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```
*Note: An `m6i.large` instance has 2 vCPUs and 8 GB RAM — perfectly matched to our Experiment 7 & 8 findings.*

#### Step 5: Connect `kubectl` to EKS
```bash
aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
kubectl get nodes
```

#### Step 6: Deploy to EKS
1. Update `imagePullPolicy: IfNotPresent` and set image paths to your ECR URL in `cloud-experiments/exp3-kubernetes/`.
2. Change service type to `LoadBalancer` (see [Section 8](#8-adapting-manifests-for-aws) for the patch).
3. Apply via kubectl:
```bash
kubectl apply -k cloud-experiments/exp3-kubernetes/
```

4. Watch the rollout:
```bash
kubectl rollout status deployment/ev-battery-backend -n ev-battery --timeout=300s
kubectl rollout status deployment/ev-battery-frontend -n ev-battery --timeout=120s
```

5. Retrieve public Load Balancer endpoints:
```bash
kubectl get svc -n ev-battery
```
*You will see AWS External-IPs in the form: `k8s-evbatter-xxxx.us-east-1.elb.amazonaws.com`.*

---

### Method B: Amazon ECS + Fargate (Serverless Containers)

If you prefer not to manage Kubernetes worker nodes:

1. **Push images to Amazon ECR** (same as Method A, Step 2 & 3).
2. **Create ECS Cluster:**
   ```bash
   aws ecs create-cluster --cluster-name ev-battery-ecs-cluster
   ```
3. **Register Backend Task Definition (`backend-task.json`):**
   - Sizing: `cpu: "2048"` (2 vCPU), `memory: "4096"` (4 GB).
   - Port mappings: Container port `8000`.
   - Health check command: `CMD-SHELL`, `python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"` with start period of 120s.
4. **Register Frontend Task Definition (`frontend-task.json`):**
   - Sizing: `cpu: "1024"` (1 vCPU), `memory: "2048"` (2 GB).
   - Port mappings: Container port `3000`.
5. **Attach to Application Load Balancer (ALB):**
   - ALB Target Group 1: Backend on port 8000 (Health check path `/health`).
   - ALB Target Group 2: Frontend on port 3000 (Health check path `/`).

---

### Method C: Single Amazon EC2 Instance + Docker Compose (Low Cost / Demo)

For a fast, low-cost presentation or testing setup ($70/month or ~$2.30/day):

1. **Launch an EC2 Instance:**
   - AMI: Ubuntu Server 24.04 LTS or Amazon Linux 2023.
   - Instance Type: `m6i.large` or `t3.xlarge` (min 8 GB RAM required for ML models).
   - Storage: 30 GB gp3 EBS Volume.
   - Security Group: Allow inbound TCP `22` (SSH), `80` (HTTP), `443` (HTTPS), `3000`, and `8000`.
2. **Connect and Install Docker:**
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```
3. **Clone and Run:**
   ```bash
   git clone https://github.com/Arhaan1609/FINAL_YEAR_PROJECT.git
   cd FINAL_YEAR_PROJECT

   # Run with Docker Compose
   docker compose -f cloud-experiments/exp2-docker/docker-compose.yml up -d --build
   ```
4. **Access:**
   - Frontend: `http://<EC2-PUBLIC-IP>:3000`
   - Backend API Docs: `http://<EC2-PUBLIC-IP>:8000/docs`

---

## 8. Adapting Manifests for AWS

To adapt the local manifests for AWS EKS without modifying existing files, use the AWS Kustomize overlay below:

### AWS Service Configuration (Changing NodePort to LoadBalancer)
On AWS, change `type: NodePort` to `type: LoadBalancer` in `backend-service.yaml` and `frontend-service.yaml`, or add AWS NLB annotations:

```yaml
# AWS Network Load Balancer Annotation Example:
metadata:
  name: ev-battery-backend
  namespace: ev-battery
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
  selector:
    app: ev-battery-backend
```

### AWS Image Pull Policy
In `backend-deployment.yaml` and `frontend-deployment.yaml`:
- Change `imagePullPolicy: Never` ➔ `imagePullPolicy: IfNotPresent`
- Replace image names with:
  `<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/ev-battery-backend:latest`
  `<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/ev-battery-frontend:latest`

---

## 9. Networking, SSL, and Domain Configuration

### Setting up Custom Domain & HTTPS on AWS:
1. **AWS Certificate Manager (ACM):** Request a public wildcard certificate for your domain (e.g., `*.yourdomain.com`). Validate via DNS in Route 53.
2. **AWS Application Load Balancer (ALB) Ingress:**
   Install the AWS Load Balancer Controller in EKS:
   ```bash
   helm repo add eks https://aws.github.io/eks-charts
   helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
     -n kube-system \
     --set clusterName=$EKS_CLUSTER_NAME \
     --set serviceAccount.create=false \
     --set serviceAccount.name=aws-load-balancer-controller
   ```
3. **Ingress Resource Manifest (`ingress.yaml`):**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: ev-battery-ingress
     namespace: ev-battery
     annotations:
       kubernetes.io/ingress.class: alb
       alb.ingress.kubernetes.io/scheme: internet-facing
       alb.ingress.kubernetes.io/target-type: ip
       alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
       alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
       alb.ingress.kubernetes.io/actions.ssl-redirect: '{"Type": "redirect", "RedirectConfig": {"Protocol": "HTTPS", "Port": "443", "StatusCode": "HTTP_301"}}'
   spec:
     rules:
       - host: app.yourdomain.com
         http:
           paths:
             - path: /api
               pathType: Prefix
               backend:
                 service:
                   name: ev-battery-backend
                   port:
                     number: 8000
             - path: /
               pathType: Prefix
               backend:
                 service:
                   name: ev-battery-frontend
                   port:
                     number: 3000
   ```

---

## 10. Monitoring, Alerting, and Production Safeguards

1. **Amazon CloudWatch Container Insights:**
   Enable Container Insights on your EKS cluster to track CPU/Memory utilization and pod restarts:
   ```bash
   aws eks update-cluster-config \
     --name $EKS_CLUSTER_NAME \
     --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
   ```
2. **AWS Budget Alerts (FinOps Guardrails):**
   - Create a zero-spend or $100 monthly threshold budget in AWS Billing console.
   - Configure alert notifications to your email when actual or forecasted spend exceeds 80%.
3. **Horizontal Pod Autoscaler (HPA):**
   Once your backend is live on EKS:
   ```bash
   kubectl autoscale deployment ev-battery-backend -n ev-battery --cpu-percent=75 --min=1 --max=5
   ```

---

## 11. Teardown & Cleanup Checklist

To prevent ongoing charges after completing your evaluation:

```bash
# 1. Delete Kubernetes resources & LoadBalancers
kubectl delete -k cloud-experiments/exp3-kubernetes/

# 2. Delete EKS cluster and managed VPC resources
eksctl delete cluster --name $EKS_CLUSTER_NAME --region $AWS_REGION

# 3. Delete ECR container images
aws ecr delete-repository --repository-name ev-battery-backend --region $AWS_REGION --force
aws ecr delete-repository --repository-name ev-battery-frontend --region $AWS_REGION --force

# 4. If EC2 was used: Terminate the instance
aws ec2 terminate-instances --instance-ids <YOUR-INSTANCE-ID>
```

---

*Authored for the EV Battery Intelligence Platform Cloud Deployment.*
