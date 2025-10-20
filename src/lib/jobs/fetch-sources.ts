import { getEnabledSources } from '@/db/queries';
import { SourceConnectorFactory } from '@/lib/sources';
import { createContent } from '@/db/queries';

export async function fetchAllSources(): Promise<{
  success: boolean;
  totalFetched: number;
  results: Array<{
    sourceId: string;
    sourceName: string;
    success: boolean;
    count: number;
    error?: string;
  }>;
}> {
  try {
    const sources = await getEnabledSources();
    const results = [];
    let totalFetched = 0;

    for (const source of sources) {
      try {
        console.log(`Fetching from source: ${source.name} (${source.id})`);
        
        const connector = SourceConnectorFactory.create(
          source.type as any,
          source.id,
          {
            ...source.config,
            url: source.url
          }
        );

        const contents = await connector.fetch();
        
        // Save content to database
        const savedContents = [];
        for (const content of contents) {
          const saved = await createContent(content);
          savedContents.push(saved[0]);
        }

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: true,
          count: savedContents.length,
        });

        totalFetched += savedContents.length;
        console.log(`Fetched ${savedContents.length} items from ${source.name}`);
      } catch (error) {
        console.error(`Failed to fetch from source ${source.name}:`, error);
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      totalFetched,
      results,
    };
  } catch (error) {
    console.error('Error in fetchAllSources:', error);
    return {
      success: false,
      totalFetched: 0,
      results: [],
    };
  }
}
