import { EventSourceConnector } from './event-base';
import { EventObject, RAConfig, SourceType } from '@/types/content';

interface RAEvent {
  id: string | number;
  title?: string;
  name?: string;
  content?: string;
  contentUrl?: string;
  url?: string;
  flyerFront?: string;
  flyerBack?: string;
  images?: Array<{ filename: string }>;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: {
    name: string;
    address?: string;
    area?: {
      name: string;
      country?: {
        name: string;
      };
    };
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  promoter?: {
    name: string;
    url?: string;
  };
  artists?: Array<{
    name: string;
  }>;
  genres?: Array<{
    name: string;
  }>;
  cost?: string;
  costType?: string;
  pickup?: boolean;
  attending?: number;
}

interface RAGraphQLResponse {
  data?: {
    listing?: {
      data?: RAEvent[];
    };
    events?: {
      data?: RAEvent[];
    };
    eventListings?: RAEvent[];
  };
  errors?: Array<{ message: string }>;
}

export class RAConnector extends EventSourceConnector {
  private graphqlUrl = 'https://ra.co/graphql';

  getSourceType(): SourceType {
    return SourceType.RA;
  }

  protected async fetchEvents(): Promise<EventObject[]> {
    const config = this.config as RAConfig;
    const events: EventObject[] = [];

    this.log('Starting event fetch');

    try {
      if (config.areaId) {
        const areaEvents = await this.fetchFromArea(config.areaId);
        events.push(...areaEvents);
      }

      if (config.clubId) {
        const clubEvents = await this.fetchFromClub(config.clubId);
        events.push(...clubEvents);
      }

      if (config.city) {
        const cityEvents = await this.fetchFromCity(config.city);
        events.push(...cityEvents);
      }

      if (events.length === 0 && !config.areaId && !config.clubId && !config.city) {
        this.log('No specific config provided, fetching Detroit events by default', 'warn');
        const defaultEvents = await this.fetchFromCity('Detroit');
        events.push(...defaultEvents);
      }

      this.log(`Fetched ${events.length} events from RA`);
      return events;
    } catch (error) {
      this.log(`Error fetching RA events: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  }

  private async fetchFromArea(areaId: string): Promise<EventObject[]> {
    const query = `
      query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) {
        listing(filters: $filters, pageSize: $pageSize, page: 1) {
          data {
            id
            title
            contentUrl
            date
            startTime
            endTime
            flyerFront
            venue {
              name
              address
              area {
                name
                country {
                  name
                }
              }
            }
            artists {
              name
            }
            genres {
              name
            }
            cost
            attending
            pickup
          }
          totalResults
        }
      }
    `;

    const variables = {
      filters: {
        areas: { eq: parseInt(areaId) },
        listingDate: { gte: new Date().toISOString().split('T')[0] },
      },
      pageSize: 50,
    };

    const response = await this.makeGraphQLRequest(query, variables);
    
    if (response.data?.listing?.data) {
      return response.data.listing.data.map(event => this.normalizeEvent(event));
    }
    
    return [];
  }

  private async fetchFromClub(clubId: string): Promise<EventObject[]> {
    const query = `
      query GET_CLUB_EVENTS($id: ID!, $pageSize: Int) {
        events(venue: $id, pageSize: $pageSize) {
          data {
            id
            title
            contentUrl
            date
            startTime
            endTime
            flyerFront
            venue {
              name
              address
              area {
                name
                country {
                  name
                }
              }
            }
            artists {
              name
            }
            genres {
              name
            }
            cost
            attending
          }
        }
      }
    `;

    const response = await this.makeGraphQLRequest(query, { id: clubId, pageSize: 50 });
    
    if (response.data?.events?.data) {
      return response.data.events.data.map(event => this.normalizeEvent(event));
    }
    
    return [];
  }

  private async fetchFromCity(city: string): Promise<EventObject[]> {
    const cityAreaMap: Record<string, number> = {
      'Detroit': 23,
      'New York': 8,
      'Los Angeles': 12,
      'Chicago': 14,
      'London': 13,
      'Berlin': 34,
      'Amsterdam': 29,
      'Ibiza': 25,
      'Miami': 11,
    };

    const areaId = cityAreaMap[city];
    
    if (areaId) {
      return this.fetchFromArea(areaId.toString());
    }

    this.log(`Unknown city "${city}", attempting search`, 'warn');
    return this.searchEvents(city);
  }

  private async searchEvents(searchTerm: string): Promise<EventObject[]> {
    const query = `
      query SEARCH_EVENTS($query: String!, $pageSize: Int) {
        listing(
          filters: { 
            query: { contains: $query },
            listingDate: { gte: "${new Date().toISOString().split('T')[0]}" }
          }, 
          pageSize: $pageSize
        ) {
          data {
            id
            title
            contentUrl
            date
            startTime
            endTime
            flyerFront
            venue {
              name
              address
              area {
                name
                country {
                  name
                }
              }
            }
            artists {
              name
            }
            genres {
              name
            }
            cost
            attending
          }
        }
      }
    `;

    try {
      const response = await this.makeGraphQLRequest(query, { query: searchTerm, pageSize: 50 });
      
      if (response.data?.listing?.data) {
        return response.data.listing.data.map(event => this.normalizeEvent(event));
      }
    } catch (error) {
      this.log(`Search failed: ${error}`, 'warn');
    }

    return [];
  }

  private async makeGraphQLRequest(query: string, variables: Record<string, unknown>): Promise<RAGraphQLResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; EventFeeder/1.0)',
      'Accept': 'application/json',
      'Referer': 'https://ra.co/',
      'Origin': 'https://ra.co',
    };

    try {
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('RA API access denied. The API may require authentication or may have changed.');
        }
        if (response.status === 429) {
          throw new Error('RA API rate limit exceeded. Try again later.');
        }
        throw new Error(`RA API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(`RA GraphQL error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error connecting to RA API');
      }
      throw error;
    }
  }

  private normalizeEvent(event: RAEvent): EventObject {
    const title = event.title || event.name || 'Untitled Event';
    
    const venue = event.venue ? {
      name: event.venue.name || 'Unknown Venue',
      address: event.venue.address,
      city: event.venue.area?.name,
      country: event.venue.area?.country?.name,
      latitude: event.venue.coordinates?.latitude,
      longitude: event.venue.coordinates?.longitude,
    } : undefined;

    const imageUrl = event.flyerFront || 
                     event.flyerBack || 
                     (event.images && event.images.length > 0 ? event.images[0].filename : undefined);

    let startTime: Date;
    if (event.date && event.startTime) {
      startTime = new Date(`${event.date}T${event.startTime}`);
    } else if (event.date) {
      startTime = new Date(event.date);
    } else {
      startTime = new Date();
    }

    let endTime: Date | undefined;
    if (event.date && event.endTime) {
      endTime = new Date(`${event.date}T${event.endTime}`);
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
    }

    const price = this.parseCost(event.cost, event.costType);

    const organizer = event.promoter ? {
      name: event.promoter.name,
      url: event.promoter.url,
    } : undefined;

    const categories = [
      ...(event.genres?.map(g => g.name) || []),
      ...(event.artists?.map(a => a.name) || []),
    ];

    return {
      externalId: `ra_${event.id}`,
      title,
      description: event.content,
      url: event.contentUrl || event.url || `https://ra.co/events/${event.id}`,
      imageUrl,
      startTime,
      endTime,
      venue,
      organizer,
      categories,
      ticketUrl: event.contentUrl || event.url,
      price,
      rsvpCount: event.attending,
      source: SourceType.RA,
      rawData: event,
    };
  }

  private parseCost(cost?: string, costType?: string): EventObject['price'] {
    if (!cost || cost.toLowerCase() === 'free' || costType === 'free') {
      return { isFree: true };
    }

    const priceMatch = cost.match(/[\d.]+/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseFloat(p));
      const currencyMatch = cost.match(/[$£€]|USD|GBP|EUR/i);
      
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: currencyMatch?.[0] || 'USD',
        isFree: false,
      };
    }

    return { isFree: false };
  }
}
