# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository. It references the canonical rules under `.cursor/rules/` instead of duplicating them here.

## Project Overview

Bun-powered monorepo with React frontend and Hono backend API.

## Core Commands

### Development

```bash
bun run dev              # Run both frontend (port 5173) and backend (port 3005)
bun run dev:frontend     # Frontend only
bun run dev:backend      # Backend only (port 3005)
```

### Build & Testing

```bash
bun run build            # Build all workspaces
bun run build:frontend   # Build frontend only
bun run lint             # Lint all workspaces
bun run format           # Format with Prettier
bun test                 # Run tests with Bun's native test runner
```

### Package Management

```bash
bun install
bun add --filter '@iadevt1_4/frontend' <package>
bun add --filter '@iadevt1_4/backend' <package>
```

## Rules and Standards (source of truth)

Use the following rule files directly when necessary:

.cursor/rules/use-bun-instead-node.mdc
.cursor/rules/code-standards.mdc
.cursor/rules/folder-structure.mdc
.cursor/rules/react.mdc
.cursor/rules/api-rest-http.mdc
.cursor/rules/sql-database.mdc
.cursor/rules/logging.mdc
.cursor/rules/tests.mdc

## Project Structure

```
├── frontend/          # React + Vite app (@iadevt1_4/frontend)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── *.tsx     # Feature components
│   │   ├── hooks/        # Custom React hooks
│   │   └── providers.tsx # React Query setup
│   └── vite.config.ts    # Vite configuration
├── backend/           # Hono API (@iadevt1_4/backend)
│   └── src/
│       └── index.ts   # Main server entry (port 3005)
└── package.json       # Workspace configuration
```

## Key Implementation Notes

- **Runtime**: Bun (use `bun` commands, not npm/yarn/pnpm)
- **Frontend Port**: 5173 (Vite default)
- **Backend Port**: 3005
- **CORS**: Backend accepts requests from `http://localhost:5173` and `http://localhost:5175`
- **Health Check**: Available at `/health` on the backend
- **Type Safety**: Strict TypeScript throughout
- **Performance Budgets**: Frontend initial bundle <500KB; Backend responses <200ms

For React, API, testing, logging, SQL, and code standards, refer to the rule files above.
