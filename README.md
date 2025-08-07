# IADEVT1_4 Monorepo

This is a Bun-powered monorepo containing frontend and backend applications.

## Structure

```
.
├── frontend/          # React + Vite frontend application
├── backend/           # Hono backend API
├── package.json       # Root workspace configuration
├── bunfig.toml       # Bun configuration
└── bun.lock          # Lockfile for reproducible installs
```

## Workspaces

- **@iadevt1_4/frontend** - Frontend application (React + Vite + TailwindCSS)
- **@iadevt1_4/backend** - Backend API (Hono + Bun)

## Installation

```bash
bun install
```

## Development

Run all workspaces in development mode:
```bash
bun run dev
```

Run specific workspace:
```bash
bun run dev:frontend  # Run only frontend
bun run dev:backend   # Run only backend
```

## Build

Build all workspaces:
```bash
bun run build
```

Build specific workspace:
```bash
bun run build:frontend
```

## Scripts

### Root Scripts
- `bun run dev` - Run all workspaces in dev mode
- `bun run dev:frontend` - Run frontend only
- `bun run dev:backend` - Run backend only
- `bun run build` - Build all workspaces
- `bun run build:frontend` - Build frontend
- `bun run lint` - Lint all workspaces
- `bun run format` - Format all files with Prettier
- `bun run format:check` - Check formatting
- `bun run clean` - Clean all node_modules and lockfile

### Workspace Commands

You can run commands in specific workspaces using the `--filter` flag:

```bash
# Add a dependency to frontend
cd frontend && bun add <package>

# Or from root
bun add --filter '@iadevt1_4/frontend' <package>

# Run a script in backend
bun run --filter '@iadevt1_4/backend' dev
```

## Configuration

### Bun Configuration (bunfig.toml)
- Auto-installs peer dependencies
- Links workspace packages
- Uses system shell for scripts

### Prettier Configuration (.prettierrc)
- Consistent code formatting across all workspaces
- Run `bun run format` to format all files

## Features

- ✅ Bun Workspaces for monorepo management
- ✅ Shared dependencies hoisting
- ✅ Workspace-specific scripts
- ✅ Prettier code formatting
- ✅ TypeScript support
- ✅ Hot reload in development