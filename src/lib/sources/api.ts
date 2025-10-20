import { SourceConnector } from './base';
import { SourceType, APIConfig } from '@/types/content';

export class APIConnector extends SourceConnector {
  getSourceType(): SourceType {
    return SourceType.API;
  }

  async fetch(): Promise<ContentObject[]> {
    try {
      const config = this.config as APIConfig;
      
      const response = await fetch(config.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Apply custom transform if provided
      if (config.transform) {
        const transformFn = new Function('data', config.transform);
        const transformedData = transformFn(data);
        return this.processApiResponse(transformedData);
      }

      return this.processApiResponse(data);
    } catch (error) {
      console.error(`Error fetching API ${this.config.url}:`, error);
      throw new Error(`Failed to fetch API data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private processApiResponse(data: any): ContentObject[] {
    // Handle different API response formats
    let items: any[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
    } else {
      // Single item
      items = [data];
    }

    return items.map(item => this.normalizeContent(item));
  }
}
