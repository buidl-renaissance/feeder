import { SourceConnector } from './base';
import { ContentObject, EventObject } from '@/types/content';
import { createContentWithDuplicatePrevention } from '@/lib/utils/duplicate-prevention';

export abstract class EventSourceConnector extends SourceConnector {
  protected abstract fetchEvents(): Promise<EventObject[]>;

  async fetch(): Promise<ContentObject[]> {
    try {
      const events = await this.fetchEvents();
      const results: ContentObject[] = [];

      for (const event of events) {
        const normalizedContent = this.eventToContent(event);
        
        try {
          const result = await createContentWithDuplicatePrevention(normalizedContent);
          if (result.created) {
            results.push(result.content);
            console.log(`✓ Created new event: "${event.title}"`);
          } else {
            console.log(`⚠ Skipped duplicate event: "${event.title}"`);
          }
        } catch (error) {
          console.error('Error creating event content with duplicate prevention:', error);
          results.push(normalizedContent as ContentObject);
        }
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching events from ${this.getSourceType()}:`, error);
      throw new Error(`Failed to fetch events: ${errorMessage}`);
    }
  }

  protected eventToContent(event: EventObject): Omit<ContentObject, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      sourceId: this.sourceId,
      sourceType: this.getSourceType(),
      title: event.title,
      description: event.description,
      url: event.url,
      rawContent: JSON.stringify(event.rawData || event),
      metadata: {
        externalId: event.externalId,
        eventType: 'event',
        startTime: event.startTime?.toISOString(),
        endTime: event.endTime?.toISOString(),
        timezone: event.timezone,
        venue: event.venue,
        organizer: event.organizer,
        categories: event.categories,
        ticketUrl: event.ticketUrl,
        price: event.price,
        imageUrl: event.imageUrl,
        capacity: event.capacity,
        rsvpCount: event.rsvpCount,
        source: event.source,
        fetchedAt: new Date().toISOString(),
      },
      status: 'PENDING',
      publishedAt: event.startTime,
    };
  }

  protected validateCredentials(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = this.config[field] || process.env[field.toUpperCase()];
      return !value;
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required credentials for ${this.getSourceType()}: ${missingFields.join(', ')}. ` +
        'Please configure these in the source settings or environment variables.'
      );
    }
  }

  protected getConfigOrEnv(key: string, envKey?: string): string | undefined {
    return this.config[key] || process.env[envKey || key.toUpperCase()];
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.getSourceType()}:${this.sourceId}]`;
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }
}
