export enum SourceType {
  RSS = 'RSS',
  YOUTUBE = 'YOUTUBE',
  API = 'API',
  FILE = 'FILE',
  LUMA = 'LUMA',
  MEETUP = 'MEETUP',
  RA = 'RA',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ContentObject {
  id: string;
  sourceId: string;
  sourceType: SourceType;
  title: string;
  description?: string;
  url?: string;
  rawContent?: string;
  processedContent?: string;
  metadata?: Record<string, any>;
  status: ProcessingStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  type: 'ai-summarize' | 'ai-tag' | 'filter' | 'transform' | 'custom';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingJob {
  id: string;
  contentId: string;
  workflowId?: string;
  status: ProcessingStatus;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceConfig {
  type: SourceType;
  name: string;
  url?: string;
  config?: Record<string, any>;
  enabled: boolean;
}

export interface RSSItem {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  categories?: string[];
  author?: string;
}

export interface APIConfig {
  endpoint: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  transform?: string; // JavaScript function as string
}

export interface FileUploadConfig {
  allowedTypes: string[];
  maxSize: number;
  transform?: string; // JavaScript function as string
}

export interface EventObject {
  externalId: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  startTime: Date;
  endTime?: Date;
  timezone?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  organizer?: {
    name: string;
    url?: string;
  };
  categories?: string[];
  ticketUrl?: string;
  price?: {
    min?: number;
    max?: number;
    currency?: string;
    isFree?: boolean;
  };
  capacity?: number;
  rsvpCount?: number;
  source: SourceType;
  rawData?: Record<string, any>;
}

export interface LumaConfig {
  calendarId?: string;
  username?: string;
  apiKey?: string;
  city?: string;
}

export interface MeetupConfig {
  groupUrlname?: string;
  topicCategory?: string;
  city?: string;
  radius?: number;
  apiKey?: string;
}

export interface RAConfig {
  areaId?: string;
  clubId?: string;
  city?: string;
}
