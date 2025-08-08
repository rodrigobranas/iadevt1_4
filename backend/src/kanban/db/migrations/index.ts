import type { Migration } from '../migrations';
import { migration001InitialSchema } from './001_initial_schema';

export const allMigrations: Migration[] = [migration001InitialSchema];
