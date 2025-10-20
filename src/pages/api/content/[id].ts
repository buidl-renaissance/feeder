import { NextApiRequest, NextApiResponse } from 'next';
import { getContentById, updateContent, deleteContent } from '@/db/queries';
import { z } from 'zod';

const updateContentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  rawContent: z.string().optional(),
  processedContent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid content ID' });
  }

  if (req.method === 'GET') {
    try {
      const content = await getContentById(id);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.status(200).json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const body = updateContentSchema.parse(req.body);
      const content = await updateContent(id, {
        ...body,
        updatedAt: new Date(),
      });
      if (!content[0]) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.status(200).json(content[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteContent(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ error: 'Failed to delete content' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
