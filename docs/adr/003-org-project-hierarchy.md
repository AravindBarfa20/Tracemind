# ADR 003: Multi-tenant Organization & Project Scoping

## Status
Accepted

## Context
Our original registry design was global (flat services table). To support modern multi-tenant enterprise deployments without future migrations, services must belong to projects, which in turn belong to tenant organizations.

## Decision
We introduced `Organization` and `Project` modules in Phase 1 before building out Telemetry logs/traces/metrics or Incident managers.
- `organizations` table: owns projects.
- `projects` table: groups related microservices.
- `services` table: references both `project_id` and `organization_id` with foreign key constraints.

## Consequences
- **Pros:** Prevents data leaks between teams, supports RBAC models in later phases, enterprise-ready scoping.
- **Cons:** Slightly more complex routers (endpoints scoped with project/org ids).
