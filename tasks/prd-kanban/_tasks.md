# Kanban Project Management – Implementation Task Summary

## Relevant Files

### Core Implementation Files (planned)

- `backend/src/index.ts` – Mount Kanban routes under `/api/v0/kanban`
- `backend/src/kanban/db/sqlite.ts` – SQLite connection and migration runner
- `backend/src/kanban/models/entities.ts` – Domain entities and DTOs
- `backend/src/kanban/repositories/kanban-repository.ts` – Repository interfaces
- `backend/src/kanban/repositories/sqlite/*.ts` – SQLite repository implementations
- `backend/src/kanban/services/kanban-service.ts` – Use-cases (move/reorder/CRUD)
- `backend/src/kanban/routes/*.ts` – Hono route modules
- `frontend/src/features/kanban/api/client.ts` – API client functions
- `frontend/src/features/kanban/components/Board.tsx` – Composition over `kibo-ui` Kanban
- `frontend/src/features/kanban/state/useKanbanBoard.ts` – Local state + optimistic updates

### Integration Points

- `frontend/src/components/ui/kibo-ui/kanban/index.tsx` – Existing Kanban UI component (DnD + a11y)
- `backend/src/index.ts` – CORS and server config (already present)

### Documentation Files

- `tasks/prd-kanban/_prd.md` – Product Requirements Document
- `tasks/prd-kanban/_techspec.md` – Technical Specification

## Tasks

- [x] 1.0 Backend: Initialize SQLite and migrations
  - Depends on: none
  - Deliverables: `sqlite.ts`, migration DDL for boards/columns/cards, indices

- [x] 2.0 Backend: Define domain models and repository interfaces
  - Depends on: 1.0
  - Deliverables: `entities.ts`, `kanban-repository.ts`

- [x] 3.0 Backend: Implement SQLite repositories (boards, columns, cards)
  - Depends on: 2.0
  - Deliverables: `repositories/sqlite/*.ts` with CRUD, move/reorder ops

- [ ] 4.0 Backend: Implement domain services (CRUD, moveCard, reorderCard, deleteColumn with confirm)
  - Depends on: 3.0
  - Deliverables: `services/kanban-service.ts` with tested logic

- [ ] 5.0 Backend: Expose Hono routes `/api/v0/kanban` (boards/columns/cards, move/reorder)
  - Depends on: 4.0
  - Deliverables: `routes/*.ts` + mount in `backend/src/index.ts`

- [ ] 6.0 Backend: Observability & health DB check [DEFERRED]
  - Depends on: 1.0
  - Deliverables: Structured logging + `/health` includes DB status

- [ ] 7.0 Frontend: API client layer for Kanban endpoints
  - Depends on: 5.0 (API contracts), can be scaffolded earlier with mocks
  - Deliverables: `api/client.ts` functions with types

- [ ] 8.0 Frontend: Feature components using `kibo-ui` Kanban
  - Depends on: 7.0
  - Deliverables: `components/Board.tsx` wiring columns/cards

- [ ] 9.0 Frontend: Optimistic updates and error rollback for DnD
  - Depends on: 8.0
  - Deliverables: `state/useKanbanBoard.ts`, error toasts, reconciliation

- [ ] 10.0 Accessibility: Keyboard interactions and ARIA announcements verification
  - Depends on: 8.0
  - Deliverables: a11y QA checklist, fixes if needed

- [ ] 11.0 Testing: Unit (services, repositories) and API integration tests
  - Depends on: 5.0
  - Deliverables: `backend/test/**` covering CRUD and move flow

- [ ] 12.0 Performance: Seed data and p95 checks (300 cards/6 columns)
  - Depends on: 8.0
  - Deliverables: seed script, simple load measurement, optimizations if required

- [ ] 13.0 Documentation: Developer README and usage notes
  - Depends on: 8.0
  - Deliverables: README updates (run, seed, API summary)


