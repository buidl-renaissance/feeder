import { ContentObject, WorkflowStep, ProcessingStatus } from '@/types/content';
import { AISummarizeStep } from './steps/ai-summarize';
import { AITagStep } from './steps/ai-tag';
import { FilterStep } from './steps/filter';
import { TransformStep } from './steps/transform';

export interface ProcessingResult {
  success: boolean;
  content?: ContentObject;
  error?: string;
  metadata?: Record<string, any>;
}

export class ContentProcessor {
  private steps: Map<string, any> = new Map();

  constructor() {
    this.registerStep('ai-summarize', AISummarizeStep);
    this.registerStep('ai-tag', AITagStep);
    this.registerStep('filter', FilterStep);
    this.registerStep('transform', TransformStep);
  }

  private registerStep(type: string, stepClass: any) {
    this.steps.set(type, stepClass);
  }

  async processContent(content: ContentObject, workflowSteps: WorkflowStep[]): Promise<ProcessingResult> {
    try {
      let processedContent = { ...content };
      
      for (const step of workflowSteps) {
        if (!step.enabled) continue;
        
        const StepClass = this.steps.get(step.type);
        if (!StepClass) {
          throw new Error(`Unknown step type: ${step.type}`);
        }

        const stepInstance = new StepClass(step.config);
        processedContent = await stepInstance.process(processedContent);
      }

      return {
        success: true,
        content: processedContent,
        metadata: {
          processedAt: new Date().toISOString(),
          stepsExecuted: workflowSteps.filter(s => s.enabled).length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
      };
    }
  }

  async processBatch(contents: ContentObject[], workflowSteps: WorkflowStep[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    for (const content of contents) {
      const result = await this.processContent(content, workflowSteps);
      results.push(result);
    }
    
    return results;
  }
}
