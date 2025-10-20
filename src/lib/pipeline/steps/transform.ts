import { ContentObject } from '@/types/content';

export class TransformStep {
  private config: {
    transformFunction?: string;
    fieldMappings?: Record<string, string>;
    addFields?: Record<string, any>;
    removeFields?: string[];
  };

  constructor(config: any = {}) {
    this.config = {
      transformFunction: config.transformFunction,
      fieldMappings: config.fieldMappings || {},
      addFields: config.addFields || {},
      removeFields: config.removeFields || [],
    };
  }

  async process(content: ContentObject): Promise<ContentObject> {
    let transformedContent = { ...content };

    // Apply field mappings
    if (this.config.fieldMappings) {
      for (const [fromField, toField] of Object.entries(this.config.fieldMappings)) {
        if (fromField in transformedContent) {
          (transformedContent as any)[toField] = (transformedContent as any)[fromField];
        }
      }
    }

    // Add new fields
    if (this.config.addFields) {
      transformedContent.metadata = {
        ...transformedContent.metadata,
        ...this.config.addFields,
      };
    }

    // Remove specified fields
    if (this.config.removeFields) {
      for (const field of this.config.removeFields) {
        if (field in transformedContent) {
          delete (transformedContent as any)[field];
        }
      }
    }

    // Apply custom transform function
    if (this.config.transformFunction) {
      try {
        const transformFn = new Function('content', this.config.transformFunction);
        transformedContent = transformFn(transformedContent);
      } catch (error) {
        console.error('Custom transform function failed:', error);
        // Return original content if transform fails
      }
    }

    return transformedContent;
  }
}
