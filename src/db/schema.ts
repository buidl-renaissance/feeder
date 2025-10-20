import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['RSS', 'YOUTUBE', 'API', 'FILE'] }).notNull(),
  name: text('name').notNull(),
  url: text('url'),
  config: text('config', { mode: 'json' }).$type<Record<string, any>>(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  refreshRate: integer('refresh_rate').default(10), // minutes, default 10
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
  lastFetchAttempt: integer('last_fetch_attempt', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const content = sqliteTable('content', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull().references(() => sources.id),
  sourceType: text('source_type', { enum: ['RSS', 'YOUTUBE', 'API', 'FILE'] }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  rawContent: text('raw_content'),
  processedContent: text('processed_content'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  status: text('status', { enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] }).default('PENDING'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  steps: text('steps', { mode: 'json' }).$type<Array<Record<string, any>>>(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const processingJobs = sqliteTable('processing_jobs', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull().references(() => content.id),
  workflowId: text('workflow_id').references(() => workflows.id),
  status: text('status', { enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] }).default('PENDING'),
  result: text('result', { mode: 'json' }).$type<Record<string, any>>(),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;
