import { Workflow, WorkflowStep, ContentObject, ProcessingStatus } from '@/types/content';
import { ContentProcessor } from './processor';
import { createProcessingJob, updateProcessingJob } from '@/db/queries';

export class WorkflowEngine {
  private processor: ContentProcessor;

  constructor() {
    this.processor = new ContentProcessor();
  }

  async executeWorkflow(content: ContentObject, workflow: Workflow): Promise<{
    success: boolean;
    result?: ContentObject;
    error?: string;
    jobId?: string;
  }> {
    try {
      // Create processing job
      const job = await createProcessingJob({
        id: this.generateId(),
        contentId: content.id,
        workflowId: workflow.id,
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Process content through workflow steps
      const result = await this.processor.processContent(content, workflow.steps);

      if (result.success && result.content) {
        // Update job with success
        await updateProcessingJob(job[0].id, {
          status: 'COMPLETED',
          result: result.metadata,
          updatedAt: new Date(),
        });

        return {
          success: true,
          result: result.content,
          jobId: job[0].id,
        };
      } else {
        // Update job with failure
        await updateProcessingJob(job[0].id, {
          status: 'FAILED',
          error: result.error,
          updatedAt: new Date(),
        });

        return {
          success: false,
          error: result.error,
          jobId: job[0].id,
        };
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown workflow error',
      };
    }
  }

  async executeWorkflowBatch(contents: ContentObject[], workflow: Workflow): Promise<{
    success: boolean;
    results: Array<{
      contentId: string;
      success: boolean;
      result?: ContentObject;
      error?: string;
      jobId?: string;
    }>;
  }> {
    const results = [];

    for (const content of contents) {
      const result = await this.executeWorkflow(content, workflow);
      results.push({
        contentId: content.id,
        success: result.success,
        result: result.result,
        error: result.error,
        jobId: result.jobId,
      });
    }

    return {
      success: true,
      results,
    };
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
