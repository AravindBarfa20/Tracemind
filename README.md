# Tracemind — Intelligent Engineering Observability

Tracemind is a high-performance, developer-first engineering observability suite designed to ingest time-series metrics, logs, and distributed traces, correlate operational signals, and assist developers in diagnosing root causes for system anomalies.

The platform is designed to be highly resilient, modular, and secure—integrating multi-tenant project scoping, automatic connection fallbacks, and real-time middleware validation out of the box.

---

## Key Capabilities

*   **Correlated Observability Engine**: Cross-reference logs, distributed spans (`parent_span_id` chains), and Prometheus metrics across microservices under a unified UI timeline.
*   **Dynamic LLM Diagnostics Fallback**: If the primary local inference model (Ollama) is unreachable, the system automatically redirects request flows to Groq Cloud API, preventing service interruptions.
*   **Redis-Backed Rate Limiting**: Production-grade sliding-window rate limiting middleware (100 req/min per IP) built with a fail-open architecture to prioritize API availability.
*   **Multi-Tenant Organization Isolation**: Explicit workspace, project, and organization scoping applied implicitly at the ORM query level, preventing database-level tenant cross-leakage.
*   **Interactive Regression Replay**: Capture client HTTP transactions and replay them to test downstream microservice performance and regressions.

---

## Architecture & System Design

```
                     ┌────────────────────────┐
                     │    Vite Frontend       │
                     │  (React & TypeScript)  │
                     └───────────┬────────────┘
                                 │
                            HTTP / JSON
                                 ▼
                     ┌────────────────────────┐
                     │   FastAPI Web Engine   │
                     │      (Python 3.11)     │
                     └───────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   PostgreSQL   │      │  Redis Cache   │      │   LLM Layer    │
│  (Database)    │      │ (Rate Limiter) │      │ (Ollama/Groq)  │
└────────────────┘      └────────────────┘      └────────────────┘
```

### Request Pipeline & Middleware Stack
1.  **Request ID Generation**: Generates unique UUID headers for request correlation.
2.  **Security Headers**: Enforces strict XSS/Frame security policies.
3.  **Metrics Collector**: Records active connection counts and routes performance stats to a Prometheus endpoint.
4.  **Redis Sliding-Window Rate Limiter**: Validates client request budgets before processing.
5.  **Multi-Tenant Resolution**: Decodes JWT and injects database transaction boundaries scoped strictly to the user's active tenant context.

---

## Technical Stack

*   **Backend Web Server**: FastAPI (Python 3.11) using AsyncPG for non-blocking asynchronous PostgreSQL connections.
*   **Database & Migrations**: PostgreSQL 16 + Alembic for declarative schema migrations.
*   **Cache & Protection**: Redis 7 using async connection pools.
*   **UI Client**: React 18, TypeScript, Vite, React Query (TanStack) for state caching, and Tailwind-compatible design system.
*   **Security & Encryption**: bcrypt (12 rounds) for password hashing and HS256 JWT tokens for sessions.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### Fast Bootstrap
```bash
# 1. Clone the repository
git clone https://github.com/AravindBarfa20/Tracemind.git
cd Tracemind

# 2. Copy environment variables
cp .env.example .env

# 3. Provision database, run migrations, and install dependencies
make setup

# 4. Spin up dev servers in separate terminal panes
make backend-dev   # Port 8000
make frontend-dev  # Port 5173
```

---

## Operations & Configurations

### LLM / AI Configuration
LLM providers are registered inside `.env`. The system supports Ollama, Groq, and OpenAI Compat:
```ini
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
GROQ_API_KEY=your-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```
*Note: If `LLM_PROVIDER` is set to `ollama` but local Ollama is offline, the API dynamically utilizes the configured `GROQ_API_KEY` to prevent application downtime.*

### Database Migrations
Database modifications are managed declaratively using Alembic.
```bash
# Apply migrations to database
make migrate

# Generate new migration version
cd backend
.venv/bin/alembic revision --autogenerate -m "describe_changes"
```

### Running Test Suite
Verify endpoint integrity, security context hooks, and validation layers:
```bash
# Run backend test suite
make test-backend
```

---

## Directory Structure

```
Tracemind/
├── backend/              # FastAPI Application
│   ├── src/
│   │   ├── core/         # DB Connection, Redis pool, Middleware, Config
│   │   ├── auth/         # JWT Validation & Auth Pipelines
│   │   ├── telemetry/    # Telemetry Ingestion API (logs, metrics, spans)
│   │   ├── incidents/    # Alert States and Incident Timeline Registry
│   │   └── llm/          # Interface agnostic LLM client layers
│   ├── alembic/          # Database Migration Versions
│   └── tests/            # pytest integration suites
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Modular layout items & Design Tokens
│   │   ├── features/     # Feature-scoped pages (Traces, Logs, Incidents)
│   │   └── styles/       # Dark mode theme overrides & typography
│   └── vite.config.ts    # Client bundler configuration
├── docker-compose.yml    # Database & Cache infrastructure
└── Makefile              # System automation shortcuts
```
