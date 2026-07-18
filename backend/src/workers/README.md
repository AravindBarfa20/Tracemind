# Workers Module

Background worker task definitions and task queuing configuration.

## Submodules
- `scheduler/` — Periodic loops (e.g. running health checks every 60 seconds)
- `tasks/` — Asynchronous jobs (email alerts, AI summaries generation)
- `consumers/` — Subscribes to events/messages from event-driven message queues
