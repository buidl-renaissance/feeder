import { NextApiRequest, NextApiResponse } from 'next';
import { getContent, createContent } from '@/db/queries';
import { createContentWithDuplicatePrevention } from '@/lib/utils/duplicate-prevention';
import { z } from 'zod';

const createContentSchema = z.object({
  sourceId: z.string(),
  sourceType: z.enum(['RSS', 'YOUTUBE', 'API', 'FILE']),
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  rawContent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  publishedAt: z.string().datetime().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { limit = '20', offset = '0', sourceId, status, search } = req.query;
      
      const contents = await getContent(
        parseInt(limit as string),
        parseInt(offset as string),
        {
          sourceId: sourceId as string,
          status: status as string,
          search: search as string,
        }
      );
      
      res.status(200).json(contents);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = createContentSchema.parse(req.body);
      
      // Use duplicate prevention when creating content via API
      const result = await createContentWithDuplicatePrevention({
        sourceId: body.sourceId,
        sourceType: body.sourceType,
        title: body.title,
        description: body.description,
        url: body.url,
        rawContent: body.rawContent,
        metadata: body.metadata,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        status: 'PENDING' as const,
      });
      
      res.status(result.created ? 201 : 200).json({
        ...result.content,
        wasCreated: result.created
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Failed to create content' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
