import { inngest } from '../client';
import { db } from '@/db/client';
import { sources } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const scheduleSourceFetches = inngest.createFunction(
  { id: 'schedule-source-fetches' },
  { event: 'source/schedule' },
  async ({ event, step }) => {
    const { sourceId, refreshRate } = event.data;
    
    console.log(`⏰ Scheduling source ${sourceId} with ${refreshRate} minute refresh rate`);
    
    // Get source details
    const source = await step.run('get-source', async () => {
      const result = await db.select()
        .from(sources)
        .where(eq(sources.id, sourceId))
        .limit(1);
      
      return result[0];
    });
    
    if (!source) {
      console.error(`❌ Source ${sourceId} not found`);
      return { success: false, error: 'Source not found' };
    }
    
    if (!source.enabled) {
      console.log(`⏸️ Source ${sourceId} is disabled, skipping schedule`);
      return { success: true, skipped: true, reason: 'disabled' };
    }
    
    // Schedule recurring fetch job
    await step.run('schedule-recurring', async () => {
      // Cancel any existing scheduled jobs for this source
      await inngest.send({
        name: 'inngest/function.cancel',
        data: {
          functionId: 'fetch-source',
          eventId: `source-${sourceId}-recurring`
        }
      });
      
      // Schedule new recurring job
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
      
      // Schedule next occurrence
      const nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + refreshRate);
      
      await inngest.send({
        name: 'source/schedule',
        data: {
          sourceId,
          refreshRate
        },
        delay: `${refreshRate}m`
      });
    });
    
    console.log(`✅ Scheduled source ${sourceId} for ${refreshRate} minute intervals`);
    
    return {
      success: true,
      sourceId,
      refreshRate,
      nextRun: new Date(Date.now() + refreshRate * 60 * 1000)
    };
  }
);
