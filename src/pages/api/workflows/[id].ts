import { NextApiRequest, NextApiResponse } from 'next';
import { getWorkflowById, updateWorkflow, deleteWorkflow } from '@/db/queries';
import { z } from 'zod';

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['ai-summarize', 'ai-tag', 'filter', 'transform', 'custom']),
    name: z.string(),
    config: z.record(z.any()),
    enabled: z.boolean(),
  })).optional(),
  enabled: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid workflow ID' });
  }

  if (req.method === 'GET') {
    try {
      const workflow = await getWorkflowById(id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.status(200).json(workflow);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ error: 'Failed to fetch workflow' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const body = updateWorkflowSchema.parse(req.body);
      const workflow = await updateWorkflow(id, {
        ...body,
        updatedAt: new Date(),
      });
      if (!workflow[0]) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.status(200).json(workflow[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteWorkflow(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ error: 'Failed to delete workflow' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
