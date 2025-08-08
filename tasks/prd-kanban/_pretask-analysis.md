# Pre-Task Analysis Report: Task 3.0 - Backend SQLite Repositories

## Summary and Scope Recognition

**Task**: Implement SQLite repositories for boards, columns, and cards with full CRUD operations and position management.

**Scope**: Create concrete implementations of repository interfaces using `bun:sqlite`, handling JSON serialization for labels, implementing position normalization for maintaining 0..n-1 ordering, and using transactions for multi-step operations.

**Context**: Building on completed Task 1 (SQLite setup) and Task 2 (domain models and interfaces), this task creates the data access layer that will be consumed by the service layer and ultimately exposed through Hono REST endpoints.

## Relevant Files and Directories

### Core Implementation Files (To Create)

- `/backend/src/kanban/repositories/sqlite/board-repository.ts` - Board CRUD operations
- `/backend/src/kanban/repositories/sqlite/column-repository.ts` - Column CRUD with position management
- `/backend/src/kanban/repositories/sqlite/card-repository.ts` - Card CRUD with position and move operations
- `/backend/src/kanban/repositories/sqlite/helpers.ts` - Shared utilities for position normalization

### Existing Dependencies (Already Implemented)

- `/backend/src/kanban/models/entities.ts` - Type definitions (Board, Column, Card, Priority)
- `/backend/src/kanban/repositories/kanban-repository.ts` - Repository interfaces to implement
- `/backend/src/kanban/db/sqlite.ts` - Database connection management
- `/backend/src/kanban/db/migrations/001_initial_schema.ts` - Database schema

### Test Files (To Create)

- `/backend/test/repositories/board-repository.test.ts` - Board repository tests
- `/backend/test/repositories/column-repository.test.ts` - Column repository tests
- `/backend/test/repositories/card-repository.test.ts` - Card repository tests

## Dependencies and Internal APIs

### Runtime Dependencies

- **bun:sqlite** (built-in): SQLite driver with transaction support
  - Version: Native to Bun runtime
  - Role: Database operations, prepared statements, transactions

### Internal Dependencies

- **Database Module** (`kanban/db/sqlite.ts`)
  - `getDb()`: Returns singleton Database instance
  - `isDbHealthy()`: Health check function
- **Domain Models** (`kanban/models/entities.ts`)
  - Type definitions for Board, Column, Card
  - Priority enum: 'low' | 'medium' | 'high'
  - CreateCardInput and UpdateCardInput DTOs

### System APIs Used

- **crypto.randomUUID()**: Built-in UUID v4 generation for entity IDs
- **Date.toISOString()**: Timestamp generation for created_at/updated_at
- **JSON.stringify/parse**: Labels array serialization

## Documentation Matrix

### Bun SQLite API

- **Official Docs**: [Bun SQLite Guide](https://bun.sh/docs/api/sqlite)
- **Key Methods**:
  - `db.prepare()`: Create prepared statements for reuse
  - `db.transaction()`: Wrap multiple operations atomically
  - `statement.run()`: Execute statement with parameters
  - `statement.get()`: Fetch single row
  - `statement.all()`: Fetch all rows
- **Transaction Pattern**:
  ```typescript
  const transaction = db.transaction(() => {
    // Multiple operations
  });
  transaction(); // Execute
  ```

### SQLite Best Practices

- **Prepared Statements**: Prevent SQL injection, improve performance
- **Foreign Keys**: Enabled via `PRAGMA foreign_keys = ON` (already done)
- **Position Management**: Keep positions contiguous (0..n-1) for UI consistency
- **Transactions**: Use for multi-statement operations to ensure atomicity

## Risks and Assumptions

### Technical Risks

1. **Position Normalization Complexity** (Medium)
   - Risk: Race conditions during concurrent position updates
   - Mitigation: Use transactions for all position-affecting operations
2. **JSON Serialization Errors** (Low)
   - Risk: Malformed JSON in labels field could crash parsing
   - Mitigation: Wrap JSON.parse in try-catch, return empty array on error

3. **Foreign Key Violations** (Low)
   - Risk: Attempting operations on non-existent parent entities
   - Mitigation: Proper error handling with descriptive messages

### Assumptions

1. Single database file (`kanban.db`) for all operations
2. UUID v4 is sufficient for ID generation (no collisions expected)
3. Position gaps are acceptable temporarily but must be normalized
4. Labels array will remain simple strings (no nested objects)
5. Priority validation happens at repository level

## Open Questions

1. **Error Handling Strategy**: Should repositories throw errors or return Result types?
2. **Cascade Behavior**: Rely on DB cascade deletes or handle explicitly?
3. **Position Strategy**: Should we implement the suggested `setOrderForBoard/Column` pattern instead of individual reorder methods?
4. **Testing Database**: Use `:memory:` for tests or temporary file?
5. **Validation Depth**: How much input validation in repositories vs service layer?

## Implementation Outline and Test Entry Points

### Phase 1: Setup and Helpers

1. Create `sqlite/` directory structure
2. Implement shared helpers:
   - `generateId()`: UUID generation
   - `getCurrentTimestamp()`: ISO timestamp
   - `normalizePositions()`: Generic position normalization
   - `validatePriority()`: Enum validation

### Phase 2: BoardRepository Implementation

1. Implement simple CRUD operations (no position management)
2. Prepare all SQL statements in constructor
3. Handle cascade delete checks
4. Unit tests: Create, Read, Update, Delete, List

### Phase 3: ColumnRepository Implementation

1. Implement CRUD with position management
2. Create with auto-position (append to end)
3. Reorder operation with transaction
4. Delete with position normalization
5. Unit tests: CRUD, Position continuity, Reorder scenarios

### Phase 4: CardRepository Implementation (Most Complex)

1. Basic CRUD operations
2. JSON handling for labels field
3. Move operation (cross-column with dual normalization)
4. Reorder operation (within column)
5. Position normalization after all operations
6. Unit tests: CRUD, Move, Reorder, Label handling, FK constraints

### Phase 5: Integration Testing

1. Test cascade deletes work correctly
2. Test transaction rollback on errors
3. Test concurrent operations
4. Performance benchmarks with 300+ cards

### Test Plan Entry Points

**Unit Test Coverage**:

- Each repository: 10-15 test cases
- Focus areas: Position normalization, Transaction integrity, Error cases
- Mock database for isolation using `:memory:`

**Integration Test Scenarios**:

1. Create board → columns → cards flow
2. Move card between columns
3. Delete column with cards (should fail without force)
4. Cascade delete board (should remove all children)
5. Position continuity after bulk operations

## Critical Implementation Considerations

### Enhanced Position Management Pattern (Expert Recommendation)

Based on expert analysis, consider refactoring the interface methods:

**Instead of**:

```typescript
reorder(columnId: string, newPosition: number): Promise<void>;
```

**Implement**:

```typescript
setColumnOrderForBoard(boardId: string, orderedColumnIds: string[]): Promise<void>;
setCardOrderForColumn(columnId: string, orderedCardIds: string[]): Promise<void>;
```

**Benefits**:

- Atomic operations prevent race conditions
- Clearer intent for UI drag-drop integration
- Simpler transaction logic
- Easier testing

### Transaction Pattern for Delete Operations

```typescript
const deleteTransaction = db.transaction((cardId: string) => {
  const card = findCardQuery.get(cardId);
  if (!card) return;

  deleteCardQuery.run(cardId);
  normalizePositions(db, 'cards', card.column_id);
});
```

### Prepared Statement Management

Store all prepared statements as class members:

```typescript
class SqliteCardRepository {
  private createStmt: Statement;
  private findByIdStmt: Statement;
  // ... more statements

  constructor(private db: Database) {
    this.createStmt = db.prepare('INSERT INTO cards...');
    this.findByIdStmt = db.prepare('SELECT * FROM cards WHERE id = ?');
  }
}
```

## Success Criteria Checklist

- [ ] All repository methods implemented per interfaces
- [ ] Position remains contiguous (0..n-1) after all operations
- [ ] Transactions used for multi-step operations
- [ ] JSON labels properly serialized/deserialized
- [ ] Priority enum validated
- [ ] Foreign key errors handled gracefully
- [ ] Prepared statements used throughout
- [ ] Unit tests achieve >90% coverage
- [ ] Integration tests pass cascade scenarios
- [ ] Performance: <50ms for single operations with 300 cards

## Next Steps

1. **Immediate**: Create `/backend/src/kanban/repositories/sqlite/` directory
2. **First Implementation**: Start with helpers.ts for shared utilities
3. **Sequential Build**: BoardRepository → ColumnRepository → CardRepository
4. **Testing**: Write tests alongside each repository implementation
5. **Validation**: Run integration tests before marking task complete

---

_Generated: 2025-08-08_
_Task Status: Ready for Implementation_
_Estimated Effort: 4-6 hours_
_Dependencies Ready: Yes (Tasks 1 & 2 complete)_
