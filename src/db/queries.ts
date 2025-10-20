import { eq, desc, and, or, like } from 'drizzle-orm';
import { db } from './client';
import { content, sources, workflows, processingJobs } from './schema';

// Content queries
export async function getContent(limit = 20, offset = 0, filters?: {
  sourceId?: string;
  status?: string;
  search?: string;
}) {
  let query = db.select().from(content);
  
  if (filters) {
    const conditions = [];
    
    if (filters.sourceId) {
      conditions.push(eq(content.sourceId, filters.sourceId));
    }
    
    if (filters.status) {
      conditions.push(eq(content.status, filters.status as any));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(content.title, `%${filters.search}%`),
          like(content.description, `%${filters.search}%`)
        )!
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
  }
  
  return query
    .orderBy(desc(content.publishedAt), desc(content.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getContentById(id: string) {
  const result = await db.select().from(content).where(eq(content.id, id));
  return result[0];
}

export async function createContent(data: typeof content.$inferInsert) {
  return db.insert(content).values(data).returning();
}

export async function updateContent(id: string, data: Partial<typeof content.$inferInsert>) {
  return db.update(content).set(data).where(eq(content.id, id)).returning();
}

export async function deleteContent(id: string) {
  return db.delete(content).where(eq(content.id, id));
}

// Source queries
export async function getSources() {
  return db.select().from(sources).orderBy(desc(sources.createdAt));
}

export async function getSourceById(id: string) {
  const result = await db.select().from(sources).where(eq(sources.id, id));
  return result[0];
}

export async function createSource(data: typeof sources.$inferInsert) {
  return db.insert(sources).values(data).returning();
}

export async function updateSource(id: string, data: Partial<typeof sources.$inferInsert>) {
  return db.update(sources).set(data).where(eq(sources.id, id)).returning();
}

export async function deleteSource(id: string) {
  return db.delete(sources).where(eq(sources.id, id));
}

export async function getEnabledSources() {
  return db.select().from(sources).where(eq(sources.enabled, true));
}

// Workflow queries
export async function getWorkflows() {
  return db.select().from(workflows).orderBy(desc(workflows.createdAt));
}

export async function getWorkflowById(id: string) {
  const result = await db.select().from(workflows).where(eq(workflows.id, id));
  return result[0];
}

export async function createWorkflow(data: typeof workflows.$inferInsert) {
  return db.insert(workflows).values(data).returning();
}

export async function updateWorkflow(id: string, data: Partial<typeof workflows.$inferInsert>) {
  return db.update(workflows).set(data).where(eq(workflows.id, id)).returning();
}

export async function deleteWorkflow(id: string) {
  return db.delete(workflows).where(eq(workflows.id, id));
}

export async function getEnabledWorkflows() {
  return db.select().from(workflows).where(eq(workflows.enabled, true));
}

// Processing job queries
export async function getProcessingJobs(contentId?: string) {
  let query = db.select().from(processingJobs);
  
  if (contentId) {
    query = query.where(eq(processingJobs.contentId, contentId));
  }
  
  return query.orderBy(desc(processingJobs.createdAt));
}

export async function createProcessingJob(data: typeof processingJobs.$inferInsert) {
  return db.insert(processingJobs).values(data).returning();
}

export async function updateProcessingJob(id: string, data: Partial<typeof processingJobs.$inferInsert>) {
  return db.update(processingJobs).set(data).where(eq(processingJobs.id, id)).returning();
}
