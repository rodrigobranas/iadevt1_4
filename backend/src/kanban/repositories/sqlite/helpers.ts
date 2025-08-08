import type { Database } from 'bun:sqlite';
import type { Priority } from '../../models/entities';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function validatePriority(priority?: string): Priority {
  const validPriorities: Priority[] = ['low', 'medium', 'high'];
  if (!priority || !validPriorities.includes(priority as Priority)) {
    return 'medium';
  }
  return priority as Priority;
}

export function serializeLabels(labels?: string[]): string {
  return JSON.stringify(labels || []);
}

export function deserializeLabels(labelsJson: string | null): string[] {
  if (!labelsJson) return [];
  try {
    const parsed = JSON.parse(labelsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizePositions(
  db: Database,
  table: 'columns' | 'cards',
  parentId: string,
  parentField: 'board_id' | 'column_id' = table === 'columns' ? 'board_id' : 'column_id',
): void {
  const updateStmt = db.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`);

  const selectStmt = db.prepare(
    `SELECT id FROM ${table} WHERE ${parentField} = ? ORDER BY position, created_at`,
  );

  const rows = selectStmt.all(parentId) as { id: string }[];

  rows.forEach((row, index) => {
    updateStmt.run(index, row.id);
  });
}

export function setOrderForParent(
  db: Database,
  table: 'columns' | 'cards',
  parentId: string,
  orderedIds: string[],
  parentField: 'board_id' | 'column_id' = table === 'columns' ? 'board_id' : 'column_id',
): void {
  const updateStmt = db.prepare(
    `UPDATE ${table} SET position = ? WHERE id = ? AND ${parentField} = ?`,
  );

  const transaction = db.transaction(() => {
    orderedIds.forEach((id, index) => {
      updateStmt.run(index, id, parentId);
    });
  });

  transaction();
}
