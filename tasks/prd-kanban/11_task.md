---
status: pending
---

<task_context>
<domain>backend/testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server|database</dependencies>
</task_context>

# Task 11.0: Testing – Unit (services, repositories) and API integration tests

## Overview

Add unit tests for repositories and services, plus API integration tests for CRUD and move/reorder flows.

<requirements>
- Unit tests cover positive/negative paths and ordering normalization
- Integration tests cover endpoint contracts and error handling
- Seed small datasets for realistic scenarios
</requirements>

## Subtasks

- [ ] 11.1 Unit tests for repositories (CRUD, order)
- [ ] 11.2 Unit tests for services (move/reorder, deleteColumn confirm)
- [ ] 11.3 API integration tests using Bun's fetch and in-memory DB

## Implementation Details

Organize tests under `backend/test/`. Use clear naming and small functions. Prefer table-driven tests where helpful.

### Relevant Files

- `backend/test/unit/*.test.ts`
- `backend/test/integration/*.test.ts`

### Dependent Files

- `backend/src/kanban/**`

## Success Criteria

- Tests pass locally; cover critical paths
- Regressions in ordering behavior are caught
