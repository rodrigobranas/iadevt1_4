---
status: pending
---

<task_context>
<domain>documentation</domain>
<type>documentation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>http_server|database</dependencies>
</task_context>

# Task 13.0: Documentation – Developer README and usage notes

## Overview

Document how to run backend/frontend with Bun, seed data, and use the Kanban feature. Include API summary and troubleshooting.

<requirements>
- Update root and/or backend/frontend READMEs with setup steps
- Document API endpoints and expected payloads briefly
- Include seeding, health, and common issues
</requirements>

## Subtasks

- [ ] 13.1 Update backend README (run, migrate, seed)
- [ ] 13.2 Update frontend README (start, env, URLs)
- [ ] 13.3 Add API summary and troubleshooting section

## Implementation Details

Prefer concise, actionable docs with commands. Keep URLs and ports accurate (`3005`, `5173`). Use Bun-only commands.

### Relevant Files

- `backend/README.md`
- `frontend/README.md`
- `tasks/prd-kanban/_techspec.md`

### Dependent Files

- N/A

## Success Criteria

- New developer can run the system and use the Kanban board in <10 minutes
- Docs remain accurate after implementation
