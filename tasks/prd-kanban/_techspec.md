# Technical Specification

## Executive Summary

Implement a Kanban-based project management feature with a Bun + Hono backend and a React frontend reusing the existing `kibo-ui` Kanban component. The backend will expose CRUD endpoints for Boards, Columns, and Cards with ordering and drag-and-drop move semantics. The frontend will consume these endpoints and provide optimistic UI updates for fast interactions, with accessible keyboard alternatives.

MVP persistence will use `bun:sqlite` (SQLite) for simplicity, reliability, and zero-ops setup. Data access is layered behind repository interfaces to enable future replacement (e.g., Postgres). Performance targets: p95 board load ≤ 1.5s with up to 300 cards and 6 columns; drag interactions ≤ 16ms frame budget with optimistic updates. Accessibility is delivered via keyboard navigation and ARIA announcements supported by the existing component.

## System Architecture

### Domain Placement

This project does not use the `engine/` layout. We will organize components as follows:

- `backend/src/kanban/` — Domain logic
  - `models/` — Type definitions for Board, Column, Card
  - `repositories/` — Interfaces and SQLite implementations
  - `services/` — Business use-cases (create card, move card, reorder column)
  - `routes/` — Hono route modules mounted under `/api/v0/kanban`
  - `db/` — SQLite initialization and migrations
- `frontend/src/features/kanban/` — Feature integration
  - `api/` — Client functions calling backend endpoints
  - `components/` — Composition around `ui/kibo-ui/kanban`
  - `state/` — Local state helpers for optimistic updates

### Component Overview

- Backend API (Hono): Defines REST endpoints for boards, columns, cards, and move/reorder operations; validates payloads; returns JSON.
- Persistence (SQLite via `bun:sqlite`): Simple relational schema with foreign keys, ordered positions, and timestamps.
- Domain Services: Encapsulate operations like moveCard (across columns), reorderCards (within column), CRUD for entities, and integrity checks.
- Frontend Feature Layer: Binds the existing Kanban UI to API; handles optimistic updates on drag; reconciles with server responses.
- A11y/Announcements: Provided by `kibo-ui` Kanban; keyboard and screen reader support are enabled and verified.
- Observability: Structured logging in backend; basic timing metrics; health endpoint already exists at `/health`.

## Implementation Design

### Core Interfaces

TypeScript (backend) interfaces to enforce dependency inversion and testability.

```ts
// backend/src/kanban/repositories/kanban-repository.ts
export interface BoardRepository {
  create(name: string): Promise<Board>;
  getById(boardId: string): Promise<Board | null>;
  list(): Promise<Board[]>;
  rename(boardId: string, name: string): Promise<Board>;
  delete(boardId: string): Promise<void>;
}

export interface ColumnRepository {
  create(boardId: string, name: string, position: number): Promise<Column>;
  list(boardId: string): Promise<Column[]>;
  rename(columnId: string, name: string): Promise<Column>;
  reorder(columnId: string, newPosition: number): Promise<void>;
  delete(columnId: string): Promise<void>;
}

export interface CardRepository {
  create(input: CreateCardInput): Promise<Card>;
  getById(cardId: string): Promise<Card | null>;
  list(boardId: string): Promise<Card[]>;
  update(cardId: string, input: UpdateCardInput): Promise<Card>;
  delete(cardId: string): Promise<void>;
  move(cardId: string, toColumnId: string, toPosition: number): Promise<void>;
  reorder(cardId: string, toPosition: number): Promise<void>;
}
```

```ts
// backend/src/kanban/services/kanban-service.ts
export interface KanbanService {
  createColumn(boardId: string, name: string): Promise<Column>;
  createCard(input: CreateCardInput): Promise<Card>;
  moveCard(cardId: string, toColumnId: string, toPosition: number): Promise<void>;
  reorderCard(cardId: string, toPosition: number): Promise<void>;
  renameColumn(columnId: string, name: string): Promise<Column>;
  deleteColumn(columnId: string, force?: boolean): Promise<void>; // enforce confirm if cards exist
}
```

### Data Models

```ts
// backend/src/kanban/models/entities.ts
export type Priority = 'low' | 'medium' | 'high';

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number; // 0-based ordering within board
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: string; // user id or email (string for MVP)
  dueDate?: string; // ISO date
  labels: string[];
  priority: Priority;
  position: number; // 0-based ordering within column
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  priority?: Priority;
}

export type UpdateCardInput = Partial<Omit<CreateCardInput, 'boardId' | 'columnId' | 'title'>> & {
  title?: string;
};
```

SQLite schema (DDL) for MVP:

```sql
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date TEXT,
  labels TEXT NOT NULL, -- JSON string array
  priority TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_board ON cards(board_id);
```

### API Endpoints

Base path: `/api/v0/kanban`

- Boards
  - `GET /boards` — List boards
  - `POST /boards` — Create board { name }
  - `GET /boards/:boardId` — Get board details + columns + cards (optional include via `?include=columns,cards`)
  - `PATCH /boards/:boardId` — Rename board
  - `DELETE /boards/:boardId` — Delete board

- Columns
  - `GET /boards/:boardId/columns` — List columns (ordered)
  - `POST /boards/:boardId/columns` — Create column { name }
  - `PATCH /columns/:columnId` — Rename or reorder { name?, position? }
  - `DELETE /columns/:columnId` — Delete (if not empty requires `force=true`)

- Cards
  - `GET /boards/:boardId/cards` — List cards for board
  - `POST /boards/:boardId/cards` — Create card { columnId, title, description?, assignee?, dueDate?, labels?, priority? }
  - `GET /cards/:cardId` — Get card
  - `PATCH /cards/:cardId` — Update fields
  - `DELETE /cards/:cardId` — Delete
  - `POST /cards/:cardId/move` — Move card { toColumnId, toPosition }
  - `POST /cards/:cardId/reorder` — Reorder within same column { toPosition }

Request/Response format: JSON; timestamps ISO8601; arrays for labels; priority in ['low','medium','high'].

Validation: Enforce required fields; cap lengths (e.g., title ≤ 200 chars, labels ≤ 10 per card); normalize positions server-side to keep 0..n-1 contiguous.

## Integration Points

None in MVP. Authentication assumed as pre-existing app context; treat `assignee` as plain string identifier.

## Impact Analysis

| Affected Component                     | Type of Impact       | Description & Risk Level                             | Required Action                   |
| -------------------------------------- | -------------------- | ---------------------------------------------------- | --------------------------------- |
| `backend/src/index.ts`                 | API Surface Addition | Mount new Kanban routes under `/api/v0/kanban`. Low. | Add router import and `app.route` |
| `frontend/src/components/ui/kibo-ui/…` | None (Reuse)         | Existing DnD UI reused. Low.                         | Compose in feature components     |
| `frontend/src/features/kanban` (new)   | New Feature Module   | API client + bindings + state. Medium.               | Create module and integrate       |
| SQLite DB (new file `kanban.db`)       | New Persistence      | Local file storage. Low.                             | Initialize and migrate on boot    |

Performance impact: Adds endpoints; query patterns are simple (by board/column). Ensure indices as specified.

## Testing Approach

### Unit Tests

- Test domain services: `moveCard`, `reorderCard`, `createCard`, `deleteColumn` (confirm behavior).
- Test repositories with an in-memory SQLite instance; validate ordering normalization and FK constraints.
- Validate payload schemas (required fields, max lengths).

Critical scenarios:

- Move across columns updates `columnId` and repositions correctly.
- Reorder within column maintains contiguous positions.
- Delete non-empty column without `force` is rejected.

### Integration Tests

- API-level tests against Hono handlers using Bun's fetch; cover CRUD and move endpoints.
- Seed board with 3 columns and ~20 cards; verify list order and filtering by column.
- Place tests under `backend/test/integration/`.

## Development Sequencing

### Build Order

1. Backend: SQLite setup (`bun:sqlite`), models, repositories, and migrations (unblock services).
2. Backend: Services (`moveCard`, `reorderCard`, CRUD) with unit tests.
3. Backend: Hono routes and validation; integration tests; mount under `/api/v0/kanban`.
4. Frontend: Feature module consuming API; integrate with `kibo-ui` Kanban; implement optimistic updates and error rollback.
5. Accessibility verification: keyboard navigation and announcements; QA pass; minor UI polish.

### Technical Dependencies

- Bun runtime available; `bun:sqlite` accessible.
- CORS already configured in backend (verify frontend origin).
- No external services required.

## Monitoring & Observability

- Metrics: Basic counters for requests per endpoint, error rates, and average handler time (log-based initially; optional Prometheus-compatible endpoint in Phase 2).
- Logs: Structured JSON logs (method, path, status, duration, boardId/columnId/cardId when relevant).
- Health: Keep `/health`; add DB connectivity check to health payload.

## Technical Considerations

### Key Decisions

- SQLite for MVP via `bun:sqlite` for zero-ops and performance; repository abstraction to allow future DB swap.
- Optimistic UI with server reconciliation to meet interaction latency targets.
- Position normalization on the server to ensure consistent ordering and simple client logic.

### Known Risks

- Drag-and-drop a11y edge cases; mitigation: keyboard move API and ARIA announcements (already supported by UI component), add tests.
- Concurrent edits may cause position conflicts; mitigation: server-side normalization and idempotent move endpoints.
- Potential board growth beyond MVP targets; mitigation: pagination/virtualization in future phases.

### Special Requirements

- Performance targets (PRD): p95 load ≤ 1.5s for 300 cards/6 columns; drag latency ≤ 16ms.
- Ensure CORS settings include frontend dev ports (`5173`, `5175`).

### Standards Compliance

- Apply SOLID and clean layering (routes → services → repositories → db).
- Follow project code standards (English, naming, early returns, small functions, DI via interfaces).
- Unit and integration tests per testing standards.
