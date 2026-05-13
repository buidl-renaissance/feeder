import { RSSConnector } from './rss';
import { APIConnector } from './api';
import { FileConnector } from './file';
import { LumaConnector } from './luma';
import { MeetupConnector } from './meetup';
import { RAConnector } from './ra';
import { SourceType } from '@/types/content';

export class SourceConnectorFactory {
  static create(type: SourceType, sourceId: string, config: Record<string, any>) {
    switch (type) {
      case SourceType.RSS:
        return new RSSConnector(sourceId, config);
      case SourceType.YOUTUBE:
        return new RSSConnector(sourceId, config);
      case SourceType.API:
        return new APIConnector(sourceId, config);
      case SourceType.FILE:
        return new FileConnector(sourceId, config);
      case SourceType.LUMA:
        return new LumaConnector(sourceId, config);
      case SourceType.MEETUP:
        return new MeetupConnector(sourceId, config);
      case SourceType.RA:
        return new RAConnector(sourceId, config);
      default:
        throw new Error(`Unknown source type: ${type}`);
    }
  }

  static getSupportedTypes(): SourceType[] {
    return [
      SourceType.RSS,
      SourceType.YOUTUBE,
      SourceType.API,
      SourceType.FILE,
      SourceType.LUMA,
      SourceType.MEETUP,
      SourceType.RA,
    ];
  }

  static isEventSource(type: SourceType): boolean {
    return [SourceType.LUMA, SourceType.MEETUP, SourceType.RA].includes(type);
  }
}

export { RSSConnector, APIConnector, FileConnector, LumaConnector, MeetupConnector, RAConnector };
export { SourceConnector } from './base';
export { EventSourceConnector } from './event-base';
