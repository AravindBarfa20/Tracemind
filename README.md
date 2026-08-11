# Tracemind — AI-Powered Engineering Observability & Incident Response Platform

> A full-stack, developer-first engineering observability suite designed to ingest real-time metrics, logs, and distributed traces, track microservice health, and assist engineering teams with AI-driven root-cause diagnosis.

[![Live Production Web Portal](https://img.shields.io/badge/Live_Web_App-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tracemind-tau.vercel.app)
[![Live API Server](https://img.shields.io/badge/API_Gateway-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://tracemind-1cn2.onrender.com/docs)
[![Python 3.11](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/Frontend-React_18_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

---

## 🌐 Live Deployments

* **Web Portal (Production SPA)**: [https://tracemind-tau.vercel.app](https://tracemind-tau.vercel.app)
* **API Gateway & Swagger Interactive Docs**: [https://tracemind-1cn2.onrender.com/docs](https://tracemind-1cn2.onrender.com/docs)
* **API Health Check**: [https://tracemind-1cn2.onrender.com/health](https://tracemind-1cn2.onrender.com/health)

---

## 🚀 Key Features

* **Unified Microservices Registry**: Real-time service status indicators (Active/Inactive), environment tags (Production/Staging/Dev), and microservice ownership metadata.
* **Telemetry & Time-Series Ingestion**: High-throughput metric streaming (CPU, memory, request latencies) and real-time visualization powered by Recharts.
* **Distributed Traces & Log Analytics**: Correlation between trace IDs, parent-child span timelines, and structured log searching across microservice components.
* **Incident Management & Escalation**: Severity-based alerting (P0-P3), automated acknowledgement/resolution workflows, and timeline activity logs.
* **AI Diagnostic Assistant**: LLM-driven anomaly diagnosis, automated root-cause hypotheses, and actionable code fixes powered by Groq (Llama-3.3-70B) & Ollama fallback.
* **Enterprise Security & Multitenancy**: Dual-token JWT authentication (access + refresh tokens), bcrypt password hashing (12 salt rounds), tenant isolation, and sliding-window rate limiting.

---

## 🏗 System Architecture

```
                    ┌────────────────────────────────┐
                    │      Vercel Production UI      │
                    │   (React 18 / TypeScript / Vite) │
                    └───────────────┬────────────────┘
                                    │
                               HTTPS / REST
                                    ▼
                    ┌────────────────────────────────┐
                    │     Render API Gateway         │
                    │     (FastAPI / Python 3.11)    │
                    └───────────────┬────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│ Supabase Cloud │         │  Redis Cache   │         │   Groq / LLM   │
│  (PostgreSQL)  │         │ (Rate Limiter) │         │ (AI Diagnosis) │
└────────────────┘         └────────────────┘         └────────────────┘
```

---

## 💻 Tech Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **State Management**: TanStack Query (React Query v5), Zustand
* **UI Components & Icons**: Custom Design System, `lucide-react` High-Precision Vector Icons
* **Charts**: Recharts

### Backend
* **Framework**: FastAPI (Python 3.11)
* **ORM & Database**: Asyncpg + SQLAlchemy 2.0 (Async), Alembic Migrations
* **Security & Auth**: PyJWT, Passlib (bcrypt 12 rounds)
* **Cache & Rate Limiting**: Redis Async Pool + Fallback Sliding Window Limiter
* **AI Engine**: Groq Cloud API (`llama-3.3-70b-versatile`) with local Ollama fallback

---

## 🛠 Local Setup & Running Guide

### Prerequisites
* **Python**: 3.11+
* **Node.js**: 18+
* **Docker Desktop**: Running locally (for local PostgreSQL & Redis)

### 1. Clone & Environment Setup
```bash
git clone https://github.com/AravindBarfa20/Tracemind.git
cd Tracemind
```

### 2. Run Infrastructure (Docker)
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend dev server
uvicorn src.main:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 📄 Environment Variables Configuration

### Backend (`backend/.env`)
| Variable | Description | Example / Recommended Default |
| :--- | :--- | :--- |
| `APP_ENV` | Application environment mode | `production` / `development` |
| `DATABASE_URL` | Asynchronous PostgreSQL connection string | `postgresql+asyncpg://postgres:pass@host:6543/postgres` |
| `REDIS_URL` | Redis caching connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing secret key | `your-production-super-secret-key` |
| `LLM_PROVIDER` | Preferred LLM inference provider | `groq` / `ollama` |
| `GROQ_API_KEY` | Groq API authentication key | `gsk_...` |

### Frontend (`frontend/.env`)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API endpoint base URL | `https://tracemind-1cn2.onrender.com` |

---

## 🧪 Testing

Run backend integration test suite:
```bash
make test-backend
```

Run frontend production bundle check:
```bash
cd frontend && npm run build
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
