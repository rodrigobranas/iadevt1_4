---
status: completed
---

<task_context>
<domain>backend/persistence/sqlite</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 3.0: Backend – Implement SQLite repositories (boards, columns, cards)

## Overview

Implement repository methods using SQLite for CRUD and ordering operations. Ensure foreign keys and position normalization are respected.

<requirements>
- Implement `boards`, `columns`, `cards` repositories with all interface methods
- Serialize labels as JSON string; validate priority
- Normalize positions to 0..n-1 after inserts/deletes/moves
- Use transactions for multi-step move/reorder operations
</requirements>

## Subtasks

- [x] 3.1 Implement `sqlite/board-repository.ts`
- [x] 3.2 Implement `sqlite/column-repository.ts`
- [x] 3.3 Implement `sqlite/card-repository.ts`
- [x] 3.4 Add unit tests for repositories (basic CRUD and ordering)

## Implementation Details

Consult schema and interfaces in the tech spec. Use prepared statements and parameter binding. Keep functions ≤50 lines.

### Relevant Files

- `backend/src/kanban/repositories/sqlite/board-repository.ts`
- `backend/src/kanban/repositories/sqlite/column-repository.ts`
- `backend/src/kanban/repositories/sqlite/card-repository.ts`

### Dependent Files

- `backend/src/kanban/services/kanban-service.ts`

## Success Criteria

- All repository methods implemented and tested
- Position/order remains contiguous after operations


