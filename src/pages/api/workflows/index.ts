import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkflows, createWorkflow } from '@/db/queries';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['ai-summarize', 'ai-tag', 'filter', 'transform', 'custom']),
    name: z.string(),
    config: z.record(z.any()),
    enabled: z.boolean(),
  })),
  enabled: z.boolean().default(true),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const workflows = await getWorkflows();
      res.status(200).json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = createWorkflowSchema.parse(req.body);
      const workflow = await createWorkflow({
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      res.status(201).json(workflow[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
