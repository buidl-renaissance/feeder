import { getContent, getEnabledWorkflows, updateContent } from '@/db/queries';
import { WorkflowEngine } from '@/lib/pipeline/workflow-engine';

export async function processPendingContent(): Promise<{
  success: boolean;
  totalProcessed: number;
  results: Array<{
    contentId: string;
    success: boolean;
    workflowsExecuted: number;
    error?: string;
  }>;
}> {
  try {
    // Get pending content
    const pendingContent = await getContent(50, 0, { status: 'PENDING' });
    
    if (pendingContent.length === 0) {
      return {
        success: true,
        totalProcessed: 0,
        results: [],
      };
    }

    const workflows = await getEnabledWorkflows();
    
    if (workflows.length === 0) {
      console.log('No enabled workflows found, skipping content processing');
      return {
        success: true,
        totalProcessed: 0,
        results: [],
      };
    }

    const workflowEngine = new WorkflowEngine();
    const results = [];
    let totalProcessed = 0;

    for (const content of pendingContent) {
      try {
        console.log(`Processing content: ${content.title} (${content.id})`);
        
        // Update status to processing
        await updateContent(content.id, {
          status: 'PROCESSING',
          updatedAt: new Date(),
        });

        let workflowsExecuted = 0;
        let hasError = false;
        let errorMessage = '';

        // Process through each workflow
        for (const workflow of workflows) {
          try {
            const result = await workflowEngine.executeWorkflow(content, workflow);
            workflowsExecuted++;
            
            if (!result.success) {
              hasError = true;
              errorMessage = result.error || 'Workflow execution failed';
            }
          } catch (error) {
            hasError = true;
            errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
            console.error(`Workflow ${workflow.name} failed for content ${content.id}:`, error);
          }
        }

        // Update content status
        await updateContent(content.id, {
          status: hasError ? 'FAILED' : 'COMPLETED',
          updatedAt: new Date(),
        });

        results.push({
          contentId: content.id,
          success: !hasError,
          workflowsExecuted,
          error: hasError ? errorMessage : undefined,
        });

        if (!hasError) {
          totalProcessed++;
        }

        console.log(`Processed content ${content.id}: ${workflowsExecuted} workflows, success: ${!hasError}`);
      } catch (error) {
        console.error(`Failed to process content ${content.id}:`, error);
        
        // Mark as failed
        await updateContent(content.id, {
          status: 'FAILED',
          updatedAt: new Date(),
        });

        results.push({
          contentId: content.id,
          success: false,
          workflowsExecuted: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      totalProcessed,
      results,
    };
  } catch (error) {
    console.error('Error in processPendingContent:', error);
    return {
      success: false,
      totalProcessed: 0,
      results: [],
    };
  }
}
