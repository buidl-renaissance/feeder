export enum SourceType {
  RSS = 'RSS',
  YOUTUBE = 'YOUTUBE',
  API = 'API',
  FILE = 'FILE',
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
