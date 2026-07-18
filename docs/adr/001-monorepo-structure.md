# ADR 001: Monorepo Architecture Structure

## Status
Accepted

## Context
For a fast-evolving engineering observability product like Tracemind, separating backend (FastAPI) and frontend (Vite React) into separate repositories creates developer overhead during Phase 1. We need immediate coordination of changes to API contracts, types, and database schemas.

## Decision
We adopted a unified monorepo structure in `/Users/aravind/Tracemind/`:
```
Tracemind/
├── backend/        # FastAPI Python service
├── frontend/       # Vite React 19 Client
├── docs/           # Architecture decision records and API contracts
└── Makefile        # Root-level convenience commands
```

## Consequences
- **Pros:** Shared environment definitions, single git history, rapid local setup.
- **Cons:** Shared CI runners (mitigated by path filtering).
