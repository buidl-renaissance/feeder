import { inngest } from '../client';
import { db } from '@/db/client';
import { sources } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const fetchAllSources = inngest.createFunction(
  { id: 'fetch-all-sources' },
  { event: 'source/fetch-all' },
  async ({ event, step }) => {
    const { trigger } = event.data;
    
    console.log(`🔄 Fetching all sources (trigger: ${trigger})`);
    
    // Get all enabled sources
    const enabledSources = await step.run('get-sources', async () => {
      return await db.select()
        .from(sources)
        .where(eq(sources.enabled, true));
    });
    
    if (enabledSources.length === 0) {
      console.log('📭 No enabled sources found');
      return { success: true, totalSources: 0, results: [] };
    }
    
    console.log(`📊 Found ${enabledSources.length} enabled sources`);
    
    // Trigger individual fetch jobs for each source
    const results = await step.run('trigger-fetches', async () => {
      const results = [];
      
      for (const source of enabledSources) {
        try {
          // Send event to fetch individual source
          await inngest.send({
            name: 'source/fetch',
            data: {
              sourceId: source.id,
              sourceName: source.name,
              sourceType: source.type,
              url: source.url,
              config: source.config || {}
            }
          });
          
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            triggered: true
          });
        } catch (error) {
          console.error(`Error triggering fetch for source ${source.id}:`, error);
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            triggered: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return results;
    });
    
    const successCount = results.filter(r => r.triggered).length;
    const failureCount = results.filter(r => !r.triggered).length;
    
    console.log(`✅ Triggered ${successCount} source fetches, ${failureCount} failed`);
    
    return {
      success: true,
      totalSources: enabledSources.length,
      triggered: successCount,
      failed: failureCount,
      results
    };
  }
);
