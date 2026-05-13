import { EventSourceConnector } from './event-base';
import { EventObject, MeetupConfig, SourceType } from '@/types/content';

interface MeetupEvent {
  id: string;
  title: string;
  description?: string;
  eventUrl: string;
  imageUrl?: string;
  dateTime: string;
  endTime?: string;
  duration?: string;
  timezone?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  group?: {
    name: string;
    urlname: string;
    link?: string;
  };
  host?: {
    name: string;
  };
  eventType?: string;
  isOnline?: boolean;
  going?: number;
  maxTickets?: number;
  rsvpLimit?: number;
  feeSettings?: {
    amount?: number;
    currency?: string;
    accepts?: string;
  };
  topics?: Array<{ name: string }>;
}

interface MeetupGraphQLResponse {
  data?: {
    groupByUrlname?: {
      upcomingEvents?: {
        edges?: Array<{ node: MeetupEvent }>;
      };
    };
    keywordSearch?: {
      edges?: Array<{ node: MeetupEvent }>;
    };
    recommendedEventsWithSeries?: {
      edges?: Array<{ node: MeetupEvent }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export class MeetupConnector extends EventSourceConnector {
  private graphqlUrl = 'https://api.meetup.com/gql';

  getSourceType(): SourceType {
    return SourceType.MEETUP;
  }

  protected async fetchEvents(): Promise<EventObject[]> {
    const config = this.config as MeetupConfig;
    const events: EventObject[] = [];

    this.log('Starting event fetch');

    try {
      if (config.groupUrlname) {
        const groupEvents = await this.fetchFromGroup(config.groupUrlname);
        events.push(...groupEvents);
      }

      if (config.topicCategory || config.city) {
        const searchEvents = await this.searchEvents(config);
        events.push(...searchEvents);
      }

      if (events.length === 0 && !config.groupUrlname && !config.topicCategory && !config.city) {
        this.log('No specific config provided, attempting keyword search', 'warn');
        const defaultEvents = await this.searchEvents({ city: 'Detroit', topicCategory: 'tech' });
        events.push(...defaultEvents);
      }

      this.log(`Fetched ${events.length} events from Meetup`);
      return events;
    } catch (error) {
      this.log(`Error fetching Meetup events: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  }

  private async fetchFromGroup(urlname: string): Promise<EventObject[]> {
    const query = `
      query ($urlname: String!) {
        groupByUrlname(urlname: $urlname) {
          upcomingEvents(input: { first: 50 }) {
            edges {
              node {
                id
                title
                description
                eventUrl
                imageUrl
                dateTime
                endTime
                duration
                timezone
                venue {
                  name
                  address
                  city
                  country
                  lat
                  lng
                }
                group {
                  name
                  urlname
                  link
                }
                going
                maxTickets
                rsvpLimit
                feeSettings {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.makeGraphQLRequest(query, { urlname });
    
    if (response.data?.groupByUrlname?.upcomingEvents?.edges) {
      return response.data.groupByUrlname.upcomingEvents.edges
        .map((edge: { node: MeetupEvent }) => this.normalizeEvent(edge.node));
    }
    
    return [];
  }

  private async searchEvents(config: MeetupConfig): Promise<EventObject[]> {
    const query = `
      query ($filter: SearchConnectionFilter!) {
        keywordSearch(filter: $filter, input: { first: 50 }) {
          edges {
            node {
              id
              result {
                ... on Event {
                  id
                  title
                  description
                  eventUrl
                  imageUrl
                  dateTime
                  endTime
                  duration
                  timezone
                  venue {
                    name
                    address
                    city
                    country
                    lat
                    lng
                  }
                  group {
                    name
                    urlname
                    link
                  }
                  going
                  maxTickets
                  feeSettings {
                    amount
                    currency
                  }
                }
              }
            }
          }
        }
      }
    `;

    const filter: Record<string, string | number> = {
      query: config.topicCategory || '',
      source: 'EVENTS',
    };

    if (config.city) {
      filter.lat = config.city === 'Detroit' ? 42.3314 : 0;
      filter.lon = config.city === 'Detroit' ? -83.0458 : 0;
      filter.radius = config.radius || 50;
    }

    try {
      const response = await this.makeGraphQLRequest(query, { filter });
      
      if (response.data?.keywordSearch?.edges) {
        return response.data.keywordSearch.edges
          .filter((edge: { node?: { result?: MeetupEvent } }) => edge.node?.result)
          .map((edge: { node: { result: MeetupEvent } }) => this.normalizeEvent(edge.node.result));
      }
    } catch (error) {
      this.log(`Search query failed, trying alternative approach: ${error}`, 'warn');
    }

    return await this.fetchFromPublicApi();
  }

  private async fetchFromPublicApi(): Promise<EventObject[]> {
    const url = `https://www.meetup.com/gql2`;
    
    const query = `
      query {
        recommendedEventsWithSeries(
          first: 50
          sortOrder: DATETIME
        ) {
          edges {
            node {
              id
              title
              description
              eventUrl
              imageUrl
              dateTime
              endTime
              venue {
                name
                address
                city
                country
                lat
                lng
              }
              group {
                name
                urlname
              }
              going
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.recommendedEventsWithSeries?.edges) {
          return data.data.recommendedEventsWithSeries.edges
            .map((edge: { node: MeetupEvent }) => this.normalizeEvent(edge.node));
        }
      }
    } catch (error) {
      this.log(`Public API fallback also failed: ${error}`, 'error');
    }

    return [];
  }

  private async makeGraphQLRequest(query: string, variables: Record<string, unknown>): Promise<MeetupGraphQLResponse> {
    const config = this.config as MeetupConfig;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = config.apiKey || process.env.MEETUP_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Meetup API authentication failed. Check your API key.');
        }
        if (response.status === 429) {
          throw new Error('Meetup API rate limit exceeded. Try again later.');
        }
        throw new Error(`Meetup API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(`Meetup GraphQL error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error connecting to Meetup API');
      }
      throw error;
    }
  }

  private normalizeEvent(event: MeetupEvent): EventObject {
    const venue = event.venue ? {
      name: event.venue.name || 'Unknown Venue',
      address: event.venue.address,
      city: event.venue.city,
      country: event.venue.country,
      latitude: event.venue.lat,
      longitude: event.venue.lng,
    } : undefined;

    const price = event.feeSettings ? {
      min: event.feeSettings.amount || 0,
      max: event.feeSettings.amount || 0,
      currency: event.feeSettings.currency || 'USD',
      isFree: !event.feeSettings.amount || event.feeSettings.amount === 0,
    } : { isFree: true };

    const organizer = event.group ? {
      name: event.group.name,
      url: event.group.link || `https://meetup.com/${event.group.urlname}`,
    } : event.host ? {
      name: event.host.name,
    } : undefined;

    return {
      externalId: `meetup_${event.id}`,
      title: event.title,
      description: event.description,
      url: event.eventUrl,
      imageUrl: event.imageUrl,
      startTime: new Date(event.dateTime),
      endTime: event.endTime ? new Date(event.endTime) : undefined,
      timezone: event.timezone,
      venue,
      organizer,
      categories: event.topics?.map(t => t.name) || [],
      ticketUrl: event.eventUrl,
      price,
      capacity: event.maxTickets || event.rsvpLimit,
      rsvpCount: event.going,
      source: SourceType.MEETUP,
      rawData: event,
    };
  }
}
