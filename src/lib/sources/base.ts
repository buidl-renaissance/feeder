import { ContentObject, SourceType } from '@/types/content';
import { createContentWithDuplicatePrevention } from '@/lib/utils/duplicate-prevention';

export abstract class SourceConnector {
  protected sourceId: string;
  protected config: Record<string, any>;

  constructor(sourceId: string, config: Record<string, any>) {
    this.sourceId = sourceId;
    this.config = config;
  }

  abstract fetch(): Promise<ContentObject[]>;
  abstract getSourceType(): SourceType;

  protected normalizeContent(rawData: any): ContentObject {
    // Parse publication date if available
    let publishedAt: Date | undefined;
    if (rawData.pubDate) {
      publishedAt = new Date(rawData.pubDate);
      // If the date is invalid, set to undefined
      if (isNaN(publishedAt.getTime())) {
        publishedAt = undefined;
      }
    }

    return {
      id: this.generateId(),
      sourceId: this.sourceId,
      sourceType: this.getSourceType(),
      title: rawData.title || 'Untitled',
      description: rawData.description,
      url: rawData.url || rawData.link,
      rawContent: rawData.content || rawData.description,
      metadata: {
        ...rawData,
        fetchedAt: new Date().toISOString(),
      },
      status: 'PENDING' as const,
      publishedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  protected generateId(): string {
    return `${this.sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
