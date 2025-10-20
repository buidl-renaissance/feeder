import { NextApiRequest, NextApiResponse } from 'next';
import { getSources, createSource } from '@/db/queries';
import { z } from 'zod';

const createSourceSchema = z.object({
  type: z.enum(['RSS', 'YOUTUBE', 'API', 'FILE']),
  name: z.string().min(1),
  url: z.string().optional(),
  config: z.any().optional(), // Changed from z.record(z.any()) to z.any()
  enabled: z.boolean().default(true),
  refreshRate: z.number().min(1).max(60).default(10),
}).refine((data) => {
  // For non-YOUTUBE types, URL should be a valid URL if provided
  if (data.type !== 'YOUTUBE' && data.url) {
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  // For YOUTUBE type, URL is constructed from channelId, so it's always valid
  return true;
}, {
  message: "URL must be a valid URL for non-YouTube sources",
  path: ["url"]
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const sources = await getSources();
      res.status(200).json(sources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = createSourceSchema.parse(req.body);
      const source = await createSource({
        id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      res.status(201).json(source[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error creating source:', error);
        res.status(500).json({ error: 'Failed to create source' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
