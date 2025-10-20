import { inngest } from '../client';
import { db } from '@/db/client';
import { sources, content } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SourceConnectorFactory } from '@/lib/sources';
import { shouldFetchSource, updateLastFetchAttempt } from '@/lib/debounce';
import { ContentObject } from '@/types/content';

export const fetchSource = inngest.createFunction(
  { id: 'fetch-source' },
  { event: 'source/fetch' },
  async ({ event, step }) => {
    const { sourceId, sourceName, sourceType, url, config } = event.data;
    
    console.log(`🔄 Fetching source: ${sourceName} (${sourceId})`);
    
    // Check debounce rules
    const shouldFetch = await step.run('check-debounce', async () => {
      return await shouldFetchSource(sourceId);
    });
    
    if (!shouldFetch) {
      console.log(`⏸️ Source ${sourceId} is debounced, skipping fetch`);
      return { success: false, reason: 'debounced' };
    }
    
    // Update last fetch attempt
    await step.run('update-attempt', async () => {
      await updateLastFetchAttempt(sourceId);
    });
    
    try {
      // Create connector and fetch content
      const connector = SourceConnectorFactory.create(
        sourceType as any,
        sourceId,
        { ...config, url }
      );
      
      const contents = await step.run('fetch-content', async () => {
        return await connector.fetch();
      });
      
      // Save content to database
      const savedContents = await step.run('save-content', async () => {
        const savedContents = [];
        
        for (const contentItem of contents) {
          try {
            const [saved] = await db.insert(content).values({
              id: `${sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sourceId,
              sourceType: sourceType as any,
              title: contentItem.title,
              description: contentItem.description,
              url: contentItem.url,
              rawContent: contentItem.rawContent,
              metadata: contentItem.metadata,
              status: 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning();
            
            savedContents.push(saved);
          } catch (error) {
            console.error('Error saving content item:', error);
          }
        }
        
        return savedContents;
      });
      
      // Update source last fetched timestamp
      await step.run('update-source', async () => {
        await db.update(sources)
          .set({ 
            lastFetchedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(sources.id, sourceId));
      });
      
      console.log(`✅ Successfully fetched ${savedContents.length} items from ${sourceName}`);
      
      return {
        success: true,
        sourceId,
        sourceName,
        itemsFetched: savedContents.length,
        items: savedContents.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url
        }))
      };
      
    } catch (error) {
      console.error(`❌ Error fetching source ${sourceId}:`, error);
      
      return {
        success: false,
        sourceId,
        sourceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);
