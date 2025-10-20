import { NextApiRequest, NextApiResponse } from 'next';
import { getSourceById } from '@/db/queries';
import { shouldFetchSource } from '@/lib/debounce';
import { SourceConnectorFactory } from '@/lib/sources';
import { db } from '@/db/client';
import { sources, content } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Source ID is required' });
  }

  try {
    // Get source details
    const source = await getSourceById(id);
    
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    if (!source.enabled) {
      return res.status(400).json({ error: 'Source is disabled' });
    }

    // Check debounce rules
    const shouldFetch = await shouldFetchSource(id);
    
    if (!shouldFetch) {
      return res.status(429).json({ 
        error: 'Source is debounced', 
        message: 'Please wait before refreshing this source again' 
      });
    }

    console.log(`🔄 Manual refresh triggered for source: ${source.name}`);

    // Create connector and fetch content
    const connector = SourceConnectorFactory.create(
      source.type as any,
      source.id,
      { ...source.config, url: source.url }
    );

    const contents = await connector.fetch();
    
    // Save content to database
    const savedContents = [];
    for (const contentItem of contents) {
      try {
        const [saved] = await db.insert(content).values({
          id: `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceId: source.id,
          sourceType: source.type as any,
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

    // Update source last fetched timestamp and last fetch attempt
    await db.update(sources)
      .set({ 
        lastFetchedAt: new Date(),
        lastFetchAttempt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(sources.id, source.id));

    console.log(`✅ Successfully fetched ${savedContents.length} items from ${source.name}`);

    res.status(200).json({ 
      success: true, 
      message: 'Source refreshed successfully',
      sourceId: id,
      sourceName: source.name,
      itemsFetched: savedContents.length
    });

  } catch (error) {
    console.error('Error refreshing source:', error);
    res.status(500).json({ 
      error: 'Failed to refresh source',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
