---
status: completed
---

<task_context>
<domain>backend/domain/models</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Task 2.0: Backend – Define domain models and repository interfaces

## Overview

Define TypeScript models for Board, Column, Card, and DTOs. Specify repository interfaces for boards, columns, and cards to abstract persistence and support testing.

<requirements>
- Create `entities.ts` with types and enums (Priority)
- Define interfaces: `BoardRepository`, `ColumnRepository`, `CardRepository`
- Include operations for CRUD, move, and reorder
- Ensure names and fields match PRD/tech spec
</requirements>

## Subtasks

- [x] 2.1 Create `entities.ts` with core types
- [x] 2.2 Create `kanban-repository.ts` with repository interfaces
- [x] 2.3 Export types from an index barrel if helpful

## Implementation Details

Follow the data model definitions in the tech spec. Keep functions small and use descriptive names.

### Relevant Files

- `backend/src/kanban/models/entities.ts`
- `backend/src/kanban/repositories/kanban-repository.ts`

### Dependent Files

- `backend/src/kanban/repositories/sqlite/*.ts`
- `backend/src/kanban/services/kanban-service.ts`

## Success Criteria

- Types compile cleanly; interfaces are complete and consistent
- Repository interfaces cover all required operations


