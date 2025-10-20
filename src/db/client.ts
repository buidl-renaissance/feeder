import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Resolve the database path relative to the project root
const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.resolve(process.cwd(), 'local.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
