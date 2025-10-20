import { db } from '@/db/client';
import { content } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { ContentObject } from '@/types/content';

/**
 * Check if content already exists based on multiple criteria
 * This prevents duplicate content from being stored
 */
export async function checkForDuplicateContent(
  newContent: Partial<ContentObject>
): Promise<boolean> {
  if (!newContent.title || !newContent.sourceId) {
    return false;
  }

  // Create multiple conditions to check for duplicates
  const conditions = [];

  // Check by title and source (most common case)
  conditions.push(
    and(
      eq(content.title, newContent.title),
      eq(content.sourceId, newContent.sourceId)
    )
  );

  // If URL exists, also check by URL and source
  if (newContent.url) {
    conditions.push(
      and(
        eq(content.url, newContent.url),
        eq(content.sourceId, newContent.sourceId)
      )
    );
  }

  // Check for same title across different sources (to avoid cross-source duplicates)
  if (newContent.url) {
    conditions.push(
      and(
        eq(content.title, newContent.title),
        eq(content.url, newContent.url)
      )
    );
  }

  // Query the database for any matches
  const existingContent = await db
    .select()
    .from(content)
    .where(or(...conditions))
    .limit(1);

  return existingContent.length > 0;
}

/**
 * Create content with duplicate prevention
 * Returns the content if created, or existing content if duplicate found
 */
export async function createContentWithDuplicatePrevention(
  contentData: Omit<ContentObject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ created: boolean; content: ContentObject }> {
  // Check for duplicates first
  const isDuplicate = await checkForDuplicateContent(contentData);
  
  if (isDuplicate) {
    // Return existing content
    const existingContent = await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.title, contentData.title),
          eq(content.sourceId, contentData.sourceId)
        )
      )
      .limit(1);
    
    return {
      created: false,
      content: existingContent[0] as ContentObject
    };
  }

  // Create new content
  const newContent = {
    id: `${contentData.sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...contentData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.insert(content).values(newContent).returning();
  
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
