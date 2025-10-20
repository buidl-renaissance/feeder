import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: 'content-feeder',
  name: 'Content Feeder',
  // For local development, no API key needed
  // In production, you'd add: eventKey: process.env.INNGEST_EVENT_KEY
});

// Type definitions for our events
export type Events = {
  'source/fetch': {
    data: {
      sourceId: string;
      sourceName: string;
      sourceType: string;
      url: string;
      config?: Record<string, any>;
    };
  };
  'source/fetch-all': {
    data: {
      trigger: 'manual' | 'scheduled' | 'page-load';
    };
  };
  'content/process': {
    data: {
      contentId?: string;
      trigger: 'manual' | 'scheduled';
    };
  };
  'source/schedule': {
    data: {
      sourceId: string;
      refreshRate: number; // minutes
    };
  };
};
