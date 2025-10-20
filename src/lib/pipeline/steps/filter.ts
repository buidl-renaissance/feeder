import { ContentObject } from '@/types/content';

export class FilterStep {
  private config: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
    minLength?: number;
    maxLength?: number;
    requiredFields?: string[];
    sentimentFilter?: 'positive' | 'negative' | 'neutral';
    confidenceThreshold?: number;
  };

  constructor(config: any = {}) {
    this.config = {
      includeKeywords: config.includeKeywords || [],
      excludeKeywords: config.excludeKeywords || [],
      minLength: config.minLength || 0,
      maxLength: config.maxLength || Infinity,
      requiredFields: config.requiredFields || [],
      sentimentFilter: config.sentimentFilter,
      confidenceThreshold: config.confidenceThreshold || 0,
    };
  }

  async process(content: ContentObject): Promise<ContentObject> {
    const shouldInclude = this.evaluateContent(content);
    
    if (!shouldInclude) {
      return {
        ...content,
        metadata: {
          ...content.metadata,
          filtered: true,
          filterReason: 'Content did not meet filter criteria',
        },
      };
    }

    return {
      ...content,
      metadata: {
        ...content.metadata,
        filtered: false,
      },
    };
  }

  private evaluateContent(content: ContentObject): boolean {
    const text = `${content.title} ${content.description || ''} ${content.rawContent || ''}`.toLowerCase();
    
    // Check required fields
    for (const field of this.config.requiredFields!) {
      if (!content[field as keyof ContentObject]) {
        return false;
      }
    }

    // Check length constraints
    const contentLength = text.length;
    if (contentLength < this.config.minLength! || contentLength > this.config.maxLength!) {
      return false;
    }

    // Check include keywords
    if (this.config.includeKeywords!.length > 0) {
      const hasIncludeKeyword = this.config.includeKeywords!.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      if (!hasIncludeKeyword) {
        return false;
      }
    }

    // Check exclude keywords
    if (this.config.excludeKeywords!.length > 0) {
      const hasExcludeKeyword = this.config.excludeKeywords!.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      if (hasExcludeKeyword) {
        return false;
      }
    }

    // Check sentiment filter
    if (this.config.sentimentFilter && content.metadata?.sentiment) {
      if (content.metadata.sentiment !== this.config.sentimentFilter) {
        return false;
      }
    }

    // Check confidence threshold
    if (this.config.confidenceThreshold && content.metadata?.confidence) {
      if (content.metadata.confidence < this.config.confidenceThreshold) {
        return false;
      }
    }

    return true;
  }
}
