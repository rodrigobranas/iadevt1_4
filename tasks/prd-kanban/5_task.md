---
status: pending
---

<task_context>
<domain>backend/http/routes</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server|database</dependencies>
</task_context>

# Task 5.0: Backend – Expose Hono routes `/api/v0/kanban`

## Overview

Create REST endpoints for boards, columns, and cards, including move and reorder actions. Mount routes in `backend/src/index.ts` and ensure CORS works for the frontend.

<requirements>
- Implement route modules per resource; validate payloads
- Return JSON with ISO timestamps and normalized positions
- Handle errors with consistent structure and status codes
- Mount router under `/api/v0/kanban`
</requirements>

## Subtasks

- [ ] 5.1 Create `routes/boards.ts`, `routes/columns.ts`, `routes/cards.ts`
- [ ] 5.2 Wire handlers to service layer
- [ ] 5.3 Update `backend/src/index.ts` to mount the router
- [ ] 5.4 Manual verification via curl or REST client

## Implementation Details

Follow endpoint list in the tech spec. Prefer small handlers; use early returns. Ensure safe parsing of query/body.

### Relevant Files

- `backend/src/kanban/routes/*.ts`
- `backend/src/index.ts`

### Dependent Files

- `frontend/src/features/kanban/api/client.ts`

## Success Criteria

- All endpoints respond correctly and match contracts
- CORS allows requests from `localhost:5173` and `5175`

