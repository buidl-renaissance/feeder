import { EventSourceConnector } from './event-base';
import { EventObject, LumaConfig, SourceType } from '@/types/content';

interface LumaEvent {
  api_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  url: string;
  start_at: string;
  end_at?: string;
  timezone: string;
  geo_address_json?: {
    city?: string;
    country?: string;
    address?: string;
    full_address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
  };
  geo_latitude?: number;
  geo_longitude?: number;
  location_type?: string;
  meeting_url?: string;
  ticket_types?: Array<{
    price: number;
    currency?: string;
  }>;
  registration_count?: number;
  capacity?: number;
  hosts?: Array<{
    name: string;
    url?: string;
  }>;
  tags?: string[];
}

interface LumaResponse {
  entries?: Array<{ event: LumaEvent }>;
  events?: LumaEvent[];
  event?: LumaEvent;
  has_more?: boolean;
  next_cursor?: string;
}

export class LumaConnector extends EventSourceConnector {
  private baseUrl = 'https://api.lu.ma/public/v2';

  getSourceType(): SourceType {
    return SourceType.LUMA;
  }

  protected async fetchEvents(): Promise<EventObject[]> {
    const config = this.config as LumaConfig;
    const events: EventObject[] = [];

    this.log('Starting event fetch');

    try {
      if (config.calendarId) {
        const calendarEvents = await this.fetchFromCalendar(config.calendarId);
        events.push(...calendarEvents);
      }

      if (config.username) {
        const userEvents = await this.fetchFromUser(config.username);
        events.push(...userEvents);
      }

      if (config.city) {
        const cityEvents = await this.fetchFromDiscover(config.city);
        events.push(...cityEvents);
      }

      if (events.length === 0 && !config.calendarId && !config.username && !config.city) {
        this.log('No specific config provided, fetching discover events', 'warn');
        const discoverEvents = await this.fetchFromDiscover();
        events.push(...discoverEvents);
      }

      this.log(`Fetched ${events.length} events from Luma`);
      return events;
    } catch (error) {
      this.log(`Error fetching Luma events: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  }

  private async fetchFromCalendar(calendarId: string): Promise<EventObject[]> {
    const url = `${this.baseUrl}/calendar/get-items?calendar_api_id=${calendarId}`;
    const response = await this.makeRequest(url);
    
    if (response.entries) {
      return response.entries
        .filter((entry: { event?: LumaEvent }) => entry.event)
        .map((entry: { event: LumaEvent }) => this.normalizeEvent(entry.event));
    }
    
    return [];
  }

  private async fetchFromUser(username: string): Promise<EventObject[]> {
    const url = `${this.baseUrl}/user/get-events?username=${username}`;
    const response = await this.makeRequest(url);
    
    if (response.events) {
      return response.events.map((event: LumaEvent) => this.normalizeEvent(event));
    }
    
    return [];
  }

  private async fetchFromDiscover(city?: string): Promise<EventObject[]> {
    let url = `${this.baseUrl}/discover/get-events?`;
    
    if (city) {
      url += `city=${encodeURIComponent(city)}&`;
    }
    
    url += 'pagination_limit=50';
    
    const response = await this.makeRequest(url);
    
    if (response.events) {
      return response.events.map((event: LumaEvent) => this.normalizeEvent(event));
    }
    
    if (response.entries) {
      return response.entries
        .filter((entry: { event?: LumaEvent }) => entry.event)
        .map((entry: { event: LumaEvent }) => this.normalizeEvent(entry.event));
    }
    
    return [];
  }

  private async makeRequest(url: string): Promise<LumaResponse> {
    const config = this.config as LumaConfig;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const apiKey = config.apiKey || process.env.LUMA_API_KEY;
    if (apiKey) {
      headers['x-luma-api-key'] = apiKey;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Luma API authentication failed. Check your API key.');
        }
        if (response.status === 429) {
          throw new Error('Luma API rate limit exceeded. Try again later.');
        }
        throw new Error(`Luma API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error connecting to Luma API');
      }
      throw error;
    }
  }

  private normalizeEvent(event: LumaEvent): EventObject {
    const venue = event.geo_address_json ? {
      name: event.geo_address_json.full_address || event.geo_address_json.address || 'Unknown Venue',
      address: event.geo_address_json.address,
      city: event.geo_address_json.city,
      country: event.geo_address_json.country,
      latitude: event.geo_address_json.latitude || event.geo_latitude,
      longitude: event.geo_address_json.longitude || event.geo_longitude,
    } : undefined;

    const price = event.ticket_types && event.ticket_types.length > 0 ? {
      min: Math.min(...event.ticket_types.map(t => t.price)),
      max: Math.max(...event.ticket_types.map(t => t.price)),
      currency: event.ticket_types[0]?.currency || 'USD',
      isFree: event.ticket_types.every(t => t.price === 0),
    } : { isFree: true };

    const organizer = event.hosts && event.hosts.length > 0 ? {
      name: event.hosts[0].name,
      url: event.hosts[0].url,
    } : undefined;

    return {
      externalId: `luma_${event.api_id}`,
      title: event.name,
      description: event.description,
      url: event.url || `https://lu.ma/${event.api_id}`,
      imageUrl: event.cover_url,
      startTime: new Date(event.start_at),
      endTime: event.end_at ? new Date(event.end_at) : undefined,
      timezone: event.timezone,
      venue,
      organizer,
      categories: event.tags || [],
      ticketUrl: event.url,
      price,
      capacity: event.capacity,
      rsvpCount: event.registration_count,
      source: SourceType.LUMA,
      rawData: event,
    };
  }
}
