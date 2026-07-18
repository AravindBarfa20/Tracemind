# Telemetry Module

This module handles ingestion, parsing, and storage of telemetry datasets.

## Key Submodules
- `logs/` — Log ingestion and parsing (JSON, Syslog, etc.)
- `metrics/` — Metric aggregation and storage mapping (Prometheus compatible)
- `traces/` — OpenTelemetry format distributed trace ingestion
- `collectors/` — Integrations for external agents (Datadog agent, OpenTelemetry collector)
- `parsers/` — Parse raw payload events into internal span/log items
- `ingestion/` — Ingestion buffer pipelines
