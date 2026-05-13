import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'content-feeder',
  name: 'Content Feeder',
});

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
      refreshRate: number;
    };
  };
  'event/poll': {
    data: {
      sourceId?: string;
      sourceType?: 'LUMA' | 'MEETUP' | 'RA';
      forceRefresh?: boolean;
    };
  };
};
