import { NextApiRequest, NextApiResponse } from 'next';
import { getSourceById } from '@/db/queries';
import { SourceConnectorFactory } from '@/lib/sources';
import { createContent } from '@/db/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid source ID' });
  }

  try {
    const source = await getSourceById(id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    if (!source.enabled) {
      return res.status(400).json({ error: 'Source is disabled' });
    }

    // Create connector and fetch content
    const connector = SourceConnectorFactory.create(
      source.type as any,
      source.id,
      source.config || {}
    );

    const contents = await connector.fetch();

    // Save content to database
    const savedContents = [];
    for (const content of contents) {
      const saved = await createContent(content);
      savedContents.push(saved[0]);
    }

    res.status(200).json({
      message: `Fetched ${savedContents.length} items from source`,
      count: savedContents.length,
      contents: savedContents,
    });
  } catch (error) {
    console.error('Error fetching from source:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from source',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
