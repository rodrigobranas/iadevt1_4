---
status: completed
---

<task_context>
<domain>frontend/state</domain>
<type>implementation</type>
<scope>performance</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Task 9.0: Frontend – Optimistic updates and error rollback for DnD

## Overview

Implement a state hook to manage board state locally with optimistic updates for drag-and-drop, and rollback on server errors. Provide minimal toasts for feedback.

<requirements>
- Create `useKanbanBoard.ts` for local state and optimistic updates
- Update state immediately on drag/drop; call API; rollback on failure
- Provide helper to apply server-normalized positions
</requirements>

## Subtasks

- [x] 9.1 Implement local state store and helper functions
- [x] 9.2 Integrate with API client for move and reorder
- [x] 9.3 Add simple error toasts and retry

## Implementation Details

Coordinate with `Board.tsx` drag callbacks. Keep logic small and testable. Ensure stable keys and minimal re-renders.

### Relevant Files

- `frontend/src/features/kanban/state/useKanbanBoard.ts`

### Dependent Files

- `frontend/src/features/kanban/components/Board.tsx`

## Success Criteria

- Drag feels instant; server responses reconcile positions
- Errors roll back to previous state and show a message
