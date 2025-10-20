import { getEnabledSources } from '@/db/queries';
import { fetchAllSources } from './fetch-sources';
import { processPendingContent } from './process-content';

export class JobScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start() {
    // Fetch from sources every 5 minutes
    this.scheduleJob('fetch-sources', 5 * 60 * 1000, async () => {
      console.log('Running scheduled fetch from sources...');
      await fetchAllSources();
    });

    // Process pending content every 2 minutes
    this.scheduleJob('process-content', 2 * 60 * 1000, async () => {
      console.log('Running scheduled content processing...');
      await processPendingContent();
    });

    console.log('Job scheduler started');
  }

  stop() {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped job: ${name}`);
    }
    this.intervals.clear();
  }

  private scheduleJob(name: string, interval: number, job: () => Promise<void>) {
    const intervalId = setInterval(async () => {
      try {
        await job();
      } catch (error) {
        console.error(`Job ${name} failed:`, error);
      }
    }, interval);

    this.intervals.set(name, intervalId);
    console.log(`Scheduled job: ${name} (every ${interval / 1000}s)`);
  }

  // Manual job execution
  async runFetchSources() {
    try {
      await fetchAllSources();
      return { success: true, message: 'Fetch completed' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async runProcessContent() {
    try {
      await processPendingContent();
      return { success: true, message: 'Processing completed' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
