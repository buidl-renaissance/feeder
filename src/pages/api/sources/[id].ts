import { NextApiRequest, NextApiResponse } from 'next';
import { getSourceById, updateSource, deleteSource } from '@/db/queries';
import { z } from 'zod';

const updateSourceSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  config: z.record(z.any()).optional(),
  enabled: z.boolean().optional(),
  refreshRate: z.number().min(1).max(60).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid source ID' });
  }

  if (req.method === 'GET') {
    try {
      const source = await getSourceById(id);
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.status(200).json(source);
    } catch (error) {
      console.error('Error fetching source:', error);
      res.status(500).json({ error: 'Failed to fetch source' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const body = updateSourceSchema.parse(req.body);
      const source = await updateSource(id, {
        ...body,
        updatedAt: new Date(),
      });
      if (!source[0]) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.status(200).json(source[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error updating source:', error);
        res.status(500).json({ error: 'Failed to update source' });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteSource(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting source:', error);
      res.status(500).json({ error: 'Failed to delete source' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
