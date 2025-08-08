---
status: deferred
---

<task_context>
<domain>backend/observability</domain>
<type>implementation</type>
<scope>performance</scope>
<complexity>low</complexity>
<dependencies>http_server|database</dependencies>
</task_context>

# Task 6.0: Backend – Observability & health DB check

## Overview

Extend health endpoint to include DB connectivity and add basic structured logging and request timing for Kanban routes.

<requirements>
- Add DB connectivity probe to `/health`
- Add structured logs for Kanban endpoints (method, path, status, duration)
- Ensure logs include relevant IDs when present
</requirements>

## Subtasks

- [ ] 6.1 Extend health handler with DB check
- [ ] 6.2 Add simple timing middleware for Kanban routes
- [ ] 6.3 Verify log output and health JSON shape

## Implementation Details

Leverage existing `/health` and Hono middleware. Keep overhead low.

### Relevant Files

- `backend/src/index.ts`
- `backend/src/kanban/routes/*.ts`

### Dependent Files

- N/A

## Success Criteria

- Health endpoint reports DB status reliably
- Logs show request durations and IDs for troubleshooting


