import { NextApiRequest, NextApiResponse } from 'next';
import { getContentById, getEnabledWorkflows } from '@/db/queries';
import { WorkflowEngine } from '@/lib/pipeline/workflow-engine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contentId } = req.query;

  if (typeof contentId !== 'string') {
    return res.status(400).json({ error: 'Invalid content ID' });
  }

  try {
    const content = await getContentById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const workflows = await getEnabledWorkflows();
    if (workflows.length === 0) {
      return res.status(400).json({ error: 'No enabled workflows found' });
    }

    const workflowEngine = new WorkflowEngine();
    const results = [];

    // Process content through all enabled workflows
    for (const workflow of workflows) {
      const result = await workflowEngine.executeWorkflow(content, workflow);
      results.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        success: result.success,
        result: result.result,
        error: result.error,
        jobId: result.jobId,
      });
    }

    res.status(200).json({
      message: `Processed content through ${results.length} workflows`,
      results,
    });
  } catch (error) {
    console.error('Error processing content:', error);
    res.status(500).json({ 
      error: 'Failed to process content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
