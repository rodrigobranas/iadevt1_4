---
status: completed
---

<task_context>
<domain>frontend/components</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Task 8.0: Frontend – Feature components using `kibo-ui` Kanban

## Overview

Compose the existing `kibo-ui` Kanban component into a feature-level `Board.tsx`, wiring columns and cards from API and exposing callbacks for drag events.

<requirements>
- Create `Board.tsx` that renders columns and cards from API data
- Use `KanbanProvider`, `KanbanBoard`, `KanbanHeader`, `KanbanCards`, `KanbanCard`
- Provide handlers to trigger API client on data changes
</requirements>

## Subtasks

- [x] 8.1 Create feature skeleton and compose existing Kanban UI
- [x] 8.2 Integrate API client for initial load
- [x] 8.3 Wire drag callbacks to `move`/`reorder` actions

## Implementation Details

Follow types from API client. Keep rendering accessible; show assignee/due date/priority on card. Prefer concise, readable components.

### Relevant Files

- `frontend/src/features/kanban/components/Board.tsx`

### Dependent Files

- `frontend/src/features/kanban/state/useKanbanBoard.ts`

## Success Criteria

- Board renders with server data; drag events emit appropriate API calls
- UI matches MVP fields and is readable and accessible
