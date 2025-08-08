---
status: completed
---

<task_context>
<domain>frontend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Task 7.0: Frontend – API client layer for Kanban endpoints

## Overview

Create typed client functions to call backend Kanban endpoints, including helpers for list, create, update, move, and reorder operations.

<requirements>
- **MUST FOLLOW** @.cursor/rules/react.mdc rule
- Create `client.ts` with functions per endpoint
- Use fetch with proper methods and headers
- Define request/response types in TypeScript
- Handle errors consistently and return typed results
</requirements>

## Subtasks

- [x] 7.1 Define types mirroring backend models
- [x] 7.2 Implement helper for base URL and fetch wrapper
- [x] 7.3 Implement functions: boards/columns/cards CRUD, move, reorder

## Implementation Details

Base path `/api/v0/kanban`. Use environment variable for backend URL if needed. Keep functions small and typed.

### Relevant Files

- `frontend/src/features/kanban/api/client.ts`

### Dependent Files

- `frontend/src/features/kanban/components/Board.tsx`
- `frontend/src/features/kanban/state/useKanbanBoard.ts`

## Success Criteria

- API client compiles and can be imported by components/state
- Network calls succeed against running backend
