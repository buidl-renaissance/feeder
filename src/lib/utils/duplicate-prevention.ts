import { db } from '@/db/client';
import { content } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { ContentObject } from '@/types/content';

export async function checkForDuplicateContent(
  newContent: Partial<ContentObject>
): Promise<boolean> {
  if (!newContent.title || !newContent.sourceId) {
    return false;
  }

  const conditions = [];

  const externalId = newContent.metadata?.externalId;
  if (externalId) {
    conditions.push(eq(content.externalId, externalId));
  }

  conditions.push(
    and(
      eq(content.title, newContent.title),
      eq(content.sourceId, newContent.sourceId)
    )
  );

  if (newContent.url) {
    conditions.push(
      and(
        eq(content.url, newContent.url),
        eq(content.sourceId, newContent.sourceId)
      )
    );
  }

  if (newContent.url) {
    conditions.push(
      and(
        eq(content.title, newContent.title),
        eq(content.url, newContent.url)
      )
    );
  }

  const existingContent = await db
    .select()
    .from(content)
    .where(or(...conditions))
    .limit(1);

  return existingContent.length > 0;
}

export async function createContentWithDuplicatePrevention(
  contentData: Omit<ContentObject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ created: boolean; content: ContentObject }> {
  const isDuplicate = await checkForDuplicateContent(contentData);
  
  if (isDuplicate) {
    const externalId = contentData.metadata?.externalId;
    
    let existingContent;
    if (externalId) {
      existingContent = await db
        .select()
        .from(content)
        .where(eq(content.externalId, externalId))
        .limit(1);
    }
    
    if (!existingContent || existingContent.length === 0) {
      existingContent = await db
        .select()
        .from(content)
        .where(
          and(
            eq(content.title, contentData.title),
            eq(content.sourceId, contentData.sourceId)
          )
        )
        .limit(1);
    }
    
    return {
      created: false,
      content: existingContent[0] as ContentObject
    };
  }

  const externalId = contentData.metadata?.externalId;
  
  const newContent = {
    id: `${contentData.sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...contentData,
    externalId: externalId || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.insert(content).values(newContent as any).returning();
  
  return {
    created: true,
    content: result[0] as ContentObject
  };
}

/**
 * Batch create content with duplicate prevention
 * Returns array of results indicating which were created vs skipped
 */
export async function batchCreateContentWithDuplicatePrevention(
  contentArray: Array<Omit<ContentObject, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Array<{ created: boolean; content: ContentObject; original: any }>> {
  const results = [];
  
  for (const contentData of contentArray) {
    const result = await createContentWithDuplicatePrevention(contentData);
    results.push({
      ...result,
      original: contentData
    });
  }
  
  return results;
}

/**
 * Get duplicate statistics for monitoring
 */
export async function getDuplicateStats(): Promise<{
  totalContent: number;
  duplicateGroups: number;
  totalDuplicates: number;
}> {
  const allContent = await db.select().from(content);
  
  // Group by title and URL combination
  const contentGroups = new Map<string, typeof allContent>();
  
  for (const item of allContent) {
    const key = `${item.title}|${item.url || 'no-url'}`;
    if (!contentGroups.has(key)) {
      contentGroups.set(key, []);
    }
    contentGroups.get(key)!.push(item);
  }
  
  // Count duplicates
  let duplicateGroups = 0;
  let totalDuplicates = 0;
  
  for (const [_, items] of contentGroups) {
    if (items.length > 1) {
      duplicateGroups++;
      totalDuplicates += items.length - 1; // -1 because we keep one
    }
  }
  
  return {
    totalContent: allContent.length,
    duplicateGroups,
    totalDuplicates
  };
}
