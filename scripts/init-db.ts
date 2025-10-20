import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/db/schema';

// Create database connection
const sqlite = new Database('./local.db');
const db = drizzle(sqlite, { schema });

// Run migrations
migrate(db, { migrationsFolder: './src/db/migrations' });

console.log('Database initialized successfully!');
sqlite.close();
