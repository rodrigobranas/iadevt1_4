---
status: pending
---

<task_context>
<domain>devx/performance</domain>
<type>testing</type>
<scope>performance</scope>
<complexity>low</complexity>
<dependencies>http_server|database</dependencies>
</task_context>

# Task 12.0: Performance – Seed data and p95 checks (300 cards/6 columns)

## Overview

Create a seed script to populate a board with ~300 cards across 6 columns and measure p95 load time and DnD responsiveness.

<requirements>
- Seed script to create board, columns, and cards
- Simple measurement of initial board fetch and client render
- Document results and any optimizations applied
</requirements>

## Subtasks

- [ ] 12.1 Implement `scripts/seed-kanban.ts`
- [ ] 12.2 Measure load times and record results
- [ ] 12.3 Apply quick wins (indices, response shaping) if needed

## Implementation Details

Use Bun to run the seed; ensure idempotency or cleanup. Consider returning minimal payloads for initial load.

### Relevant Files

- `backend/scripts/seed-kanban.ts`
- `backend/src/kanban/**`

### Dependent Files

- `frontend/src/features/kanban/**`

## Success Criteria

- Seeded data exists; p95 load ≤ 1.5s in local test
- Documented results and next steps (if any)


