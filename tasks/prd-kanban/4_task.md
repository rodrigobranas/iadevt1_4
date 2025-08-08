---
status: pending
---

<task_context>
<domain>backend/domain/services</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 4.0: Backend – Implement domain services

## Overview

Implement service layer functions for CRUD, `moveCard`, `reorderCard`, and `deleteColumn` with confirmation logic. Enforce business rules and input validation.

<requirements>
- Implement service methods matching interfaces
- Enforce confirm requirement when deleting non-empty columns
- Use transactions where required; normalize positions
- Provide small, testable functions with early returns
</requirements>

## Subtasks

- [ ] 4.1 Implement `KanbanService` with CRUD methods
- [ ] 4.2 Implement `moveCard` and `reorderCard`
- [ ] 4.3 Add unit tests covering success and error paths

## Implementation Details

Follow clean layering: routes → services → repositories. No direct DB access in services. Keep functions ≤50 lines.

### Relevant Files

- `backend/src/kanban/services/kanban-service.ts`

### Dependent Files

- `backend/src/kanban/routes/*.ts`

## Success Criteria

- Service methods pass unit tests and handle edge cases
- Confirm behavior enforced for non-empty column deletion


