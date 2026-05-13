import { inngest } from '../client';
import { db } from '@/db/client';
import { sources } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { SourceConnectorFactory } from '@/lib/sources';
import { SourceType } from '@/types/content';

export const scheduledEventPoll = inngest.createFunction(
  { 
    id: 'scheduled-event-poll',
    name: 'Scheduled Event Poll',
    retries: 3,
  },
  { cron: '0 */2 * * *' },
  async ({ step }) => {
    console.log('⏰ Starting scheduled event poll');
    
    const now = new Date();
    
    const sourcesToFetch = await step.run('get-sources-due-for-fetch', async () => {
      const allEnabledSources = await db.select()
        .from(sources)
        .where(
          and(
            eq(sources.enabled, true),
            or(
              eq(sources.type, 'LUMA'),
              eq(sources.type, 'MEETUP'),
              eq(sources.type, 'RA')
            )
          )
        );
      
      return allEnabledSources.filter(source => {
        if (!source.lastFetchedAt) return true;
        
        const refreshMinutes = source.refreshRate || 120;
        const lastFetchTime = new Date(source.lastFetchedAt).getTime();
        const nextFetchTime = lastFetchTime + (refreshMinutes * 60 * 1000);
        
        return now.getTime() >= nextFetchTime;
      });
    });
    
    if (sourcesToFetch.length === 0) {
      console.log('📭 No event sources due for fetching');
      return { 
        success: true, 
        message: 'No sources due for fetch',
        nextPoll: 'In 2 hours'
      };
    }
    
    console.log(`📊 Found ${sourcesToFetch.length} event sources to fetch`);
    
    const results = [];
    
    for (const source of sourcesToFetch) {
      const result = await step.run(`fetch-${source.type.toLowerCase()}-${source.id}`, async () => {
        console.log(`🔄 Fetching events from ${source.name} (${source.type})`);
        
        try {
          await db.update(sources)
            .set({ 
              lastFetchAttempt: now,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          const connector = SourceConnectorFactory.create(
            source.type as SourceType,
            source.id,
            { ...source.config, url: source.url }
          );
          
          const fetchedContent = await connector.fetch();
          
          await db.update(sources)
            .set({ 
              lastFetchedAt: now,
              lastError: null,
              consecutiveFailures: 0,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          console.log(`✅ Successfully fetched ${fetchedContent.length} events from ${source.name}`);
          
          return {
            sourceId: source.id,
            sourceName: source.name,
            sourceType: source.type,
            success: true,
            itemsFetched: fetchedContent.length,
          };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error fetching ${source.name}:`, errorMessage);
          
          const currentFailures = source.consecutiveFailures || 0;
          
          await db.update(sources)
            .set({ 
              lastError: errorMessage,
              consecutiveFailures: currentFailures + 1,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          return {
            sourceId: source.id,
            sourceName: source.name,
            sourceType: source.type,
            success: false,
            error: errorMessage,
            consecutiveFailures: currentFailures + 1,
          };
        }
      });
      
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalItemsFetched = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.itemsFetched || 0), 0);
    
    console.log(`
📊 Scheduled Event Poll Complete
   ✅ Successful: ${successCount}
   ❌ Failed: ${failureCount}
   📥 Total items fetched: ${totalItemsFetched}
    `);
    
    return {
      success: true,
      timestamp: now.toISOString(),
      summary: {
        sourcesProcessed: sourcesToFetch.length,
        successful: successCount,
        failed: failureCount,
        totalItemsFetched,
      },
      results,
    };
  }
);

export const manualEventPoll = inngest.createFunction(
  { 
    id: 'manual-event-poll',
    name: 'Manual Event Poll',
    retries: 2,
  },
  { event: 'event/poll' },
  async ({ event, step }) => {
    const { sourceId, sourceType, forceRefresh } = event.data;
    
    console.log(`🔄 Manual event poll triggered${sourceId ? ` for source ${sourceId}` : ''}`);
    
    const now = new Date();
    
    const sourcesToFetch = await step.run('get-sources', async () => {
      if (sourceId) {
        return await db.select()
          .from(sources)
          .where(eq(sources.id, sourceId));
      }
      
      if (sourceType) {
        return await db.select()
          .from(sources)
          .where(
            and(
              eq(sources.enabled, true),
              eq(sources.type, sourceType)
            )
          );
      }
      
      return await db.select()
        .from(sources)
        .where(
          and(
            eq(sources.enabled, true),
            or(
              eq(sources.type, 'LUMA'),
              eq(sources.type, 'MEETUP'),
              eq(sources.type, 'RA')
            )
          )
        );
    });
    
    if (sourcesToFetch.length === 0) {
      return { 
        success: false, 
        message: 'No matching sources found'
      };
    }
    
    const results = [];
    
    for (const source of sourcesToFetch) {
      if (!forceRefresh && source.lastFetchedAt) {
        const refreshMinutes = source.refreshRate || 120;
        const lastFetchTime = new Date(source.lastFetchedAt).getTime();
        const nextFetchTime = lastFetchTime + (refreshMinutes * 60 * 1000);
        
        if (now.getTime() < nextFetchTime) {
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            success: true,
            skipped: true,
            reason: 'Not due for refresh',
          });
          continue;
        }
      }
      
      const result = await step.run(`fetch-${source.id}`, async () => {
        try {
          await db.update(sources)
            .set({ 
              lastFetchAttempt: now,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          const connector = SourceConnectorFactory.create(
            source.type as SourceType,
            source.id,
            { ...source.config, url: source.url }
          );
          
          const fetchedContent = await connector.fetch();
          
          await db.update(sources)
            .set({ 
              lastFetchedAt: now,
              lastError: null,
              consecutiveFailures: 0,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          return {
            sourceId: source.id,
            sourceName: source.name,
            success: true,
            itemsFetched: fetchedContent.length,
          };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await db.update(sources)
            .set({ 
              lastError: errorMessage,
              consecutiveFailures: (source.consecutiveFailures || 0) + 1,
              updatedAt: now
            })
            .where(eq(sources.id, source.id));
          
          return {
            sourceId: source.id,
            sourceName: source.name,
            success: false,
            error: errorMessage,
          };
        }
      });
      
      results.push(result);
    }
    
    return {
      success: true,
      timestamp: now.toISOString(),
      results,
    };
  }
);
