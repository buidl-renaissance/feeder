import { db } from '@/db/client';
import { sources } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if a source should be fetched based on debounce rules
 * @param sourceId - The source ID to check
 * @param debounceMinutes - Debounce window in minutes (default: 1)
 * @returns true if fetch should be allowed, false if debounced
 */
export async function shouldFetchSource(
  sourceId: string, 
  debounceMinutes: number = 1
): Promise<boolean> {
  try {
    const source = await db.select({
      lastFetchAttempt: sources.lastFetchAttempt,
      refreshRate: sources.refreshRate,
    })
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);

    if (!source.length) {
      return false; // Source not found
    }

    const { lastFetchAttempt, refreshRate } = source[0];
    const now = new Date();
    
    // If no previous attempt, allow fetch
    if (!lastFetchAttempt) {
      return true;
    }

    // Check debounce window (1 minute by default)
    const debounceMs = debounceMinutes * 60 * 1000;
    const timeSinceLastAttempt = now.getTime() - lastFetchAttempt.getTime();
    
    if (timeSinceLastAttempt < debounceMs) {
      console.log(`Source ${sourceId} is debounced (${Math.round(timeSinceLastAttempt / 1000)}s ago)`);
      return false;
    }

    // Check if enough time has passed based on refresh rate
    const refreshMs = (refreshRate || 10) * 60 * 1000; // Convert minutes to ms
    const timeSinceLastFetch = now.getTime() - lastFetchAttempt.getTime();
    
    if (timeSinceLastFetch < refreshMs) {
      console.log(`Source ${sourceId} not ready for refresh (rate: ${refreshRate}min)`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking debounce for source:', sourceId, error);
    return false;
  }
}

/**
 * Update the last fetch attempt timestamp for a source
 * @param sourceId - The source ID to update
 */
export async function updateLastFetchAttempt(sourceId: string): Promise<void> {
  try {
    await db.update(sources)
      .set({ 
        lastFetchAttempt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(sources.id, sourceId));
  } catch (error) {
    console.error('Error updating last fetch attempt:', sourceId, error);
  }
}
