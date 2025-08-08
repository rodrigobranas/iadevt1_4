---
status: completed
---

<task_context>
<domain>backend/db/sqlite</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 1.0: Backend – Initialize SQLite and migrations

## Overview

Set up SQLite using `bun:sqlite`, create a migration runner, and apply initial schema for boards, columns, and cards with required indices.

<requirements>
- Create a reusable SQLite connection module
- Implement migration runner that executes idempotent DDL
- Create tables: `boards`, `columns`, `cards` with FKs and timestamps
- Create indices for common lookups (by board, by column)
</requirements>

## Subtasks

- [x] 1.1 Add `sqlite.ts` to open DB and expose `getDb()`
- [x] 1.2 Implement migration runner and initial DDL
- [x] 1.3 Add indices and verify FK constraints
- [ ] 1.4 Smoke test DB init on server start (DEFERRED)

## Implementation Details

See schema in tech spec (DDL) and file layout under `backend/src/kanban/db/`.

### Relevant Files

- `backend/src/kanban/db/sqlite.ts`
- `backend/src/index.ts` (invoke migration on boot)

### Dependent Files

- `backend/src/kanban/repositories/sqlite/*.ts`
- `backend/src/kanban/services/kanban-service.ts`

## Success Criteria

- DB file initializes without errors; tables and indices exist
- Health check can report DB connectivity
- Subsequent repository operations can use the connection


