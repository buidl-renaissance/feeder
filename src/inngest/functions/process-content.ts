import { inngest } from '../client';
import { db } from '@/db/client';
import { content, workflows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { WorkflowEngine } from '@/lib/pipeline/workflow-engine';

export const processContent = inngest.createFunction(
  { id: 'process-content' },
  { event: 'content/process' },
  async ({ event, step }) => {
    const { contentId, trigger } = event.data;
    
    console.log(`🔄 Processing content (trigger: ${trigger})`);
    
    // Get pending content
    const pendingContent = await step.run('get-pending-content', async () => {
      if (contentId) {
        // Process specific content
        return await db.select()
          .from(content)
          .where(and(
            eq(content.id, contentId),
            eq(content.status, 'PENDING')
          ));
      } else {
        // Process all pending content
        return await db.select()
          .from(content)
          .where(eq(content.status, 'PENDING'));
      }
    });
    
    if (pendingContent.length === 0) {
      console.log('📭 No pending content to process');
      return { success: true, processed: 0, results: [] };
    }
    
    // Get enabled workflows
    const enabledWorkflows = await step.run('get-workflows', async () => {
      return await db.select()
        .from(workflows)
        .where(eq(workflows.enabled, true));
    });
    
    if (enabledWorkflows.length === 0) {
      console.log('📭 No enabled workflows found, marking content as completed');
      
      // Mark all content as completed without processing
      await step.run('mark-completed', async () => {
        for (const item of pendingContent) {
          await db.update(content)
            .set({ 
              status: 'COMPLETED',
              updatedAt: new Date()
            })
            .where(eq(content.id, item.id));
        }
      });
      
      return { 
        success: true, 
        processed: pendingContent.length, 
        results: pendingContent.map(item => ({
          contentId: item.id,
          status: 'COMPLETED',
          workflowsExecuted: 0
        }))
      };
    }
    
    console.log(`📊 Processing ${pendingContent.length} items with ${enabledWorkflows.length} workflows`);
    
    // Process each content item
    const results = await step.run('process-items', async () => {
      const results = [];
      
      for (const contentItem of pendingContent) {
        try {
          // Update status to processing
          await db.update(content)
            .set({ 
              status: 'PROCESSING',
              updatedAt: new Date()
            })
            .where(eq(content.id, contentItem.id));
          
          let processedContent = contentItem;
          let workflowsExecuted = 0;
          
          // Run through each workflow
          for (const workflow of enabledWorkflows) {
            try {
              const workflowEngine = new WorkflowEngine(workflow);
              processedContent = await workflowEngine.execute(processedContent);
              workflowsExecuted++;
            } catch (error) {
              console.error(`Error executing workflow ${workflow.id} on content ${contentItem.id}:`, error);
            }
          }
          
          // Update content with processed result
          await db.update(content)
            .set({
              processedContent: processedContent.processedContent,
              metadata: processedContent.metadata,
              status: 'COMPLETED',
              updatedAt: new Date()
            })
            .where(eq(content.id, contentItem.id));
          
          results.push({
            contentId: contentItem.id,
            status: 'COMPLETED',
            workflowsExecuted
          });
          
        } catch (error) {
          console.error(`Error processing content ${contentItem.id}:`, error);
          
          // Mark as failed
          await db.update(content)
            .set({ 
              status: 'FAILED',
              updatedAt: new Date()
            })
            .where(eq(content.id, contentItem.id));
          
          results.push({
            contentId: contentItem.id,
            status: 'FAILED',
            workflowsExecuted: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return results;
    });
    
    const successCount = results.filter(r => r.status === 'COMPLETED').length;
    const failureCount = results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Processed ${successCount} items successfully, ${failureCount} failed`);
    
    return {
      success: true,
      processed: results.length,
      successful: successCount,
      failed: failureCount,
      results
    };
  }
);
