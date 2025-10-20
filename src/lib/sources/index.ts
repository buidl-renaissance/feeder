import { RSSConnector } from './rss';
import { APIConnector } from './api';
import { FileConnector } from './file';
import { SourceType } from '@/types/content';

export class SourceConnectorFactory {
  static create(type: SourceType, sourceId: string, config: Record<string, any>) {
    switch (type) {
      case SourceType.RSS:
        return new RSSConnector(sourceId, config);
      case SourceType.YOUTUBE:
        // YouTube sources use RSS connector since they provide RSS feeds
        return new RSSConnector(sourceId, config);
      case SourceType.API:
        return new APIConnector(sourceId, config);
      case SourceType.FILE:
        return new FileConnector(sourceId, config);
      default:
        throw new Error(`Unknown source type: ${type}`);
    }
  }
}

export { RSSConnector, APIConnector, FileConnector };
export { SourceConnector } from './base';
