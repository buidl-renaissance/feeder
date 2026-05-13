# Specification

This document describes the intended functionality of Content Feeder — what the code is designed to do.

## System Goals

Content Feeder is designed to be a **content aggregation and processing platform** that:

1. Collects content from multiple heterogeneous sources
2. Normalizes content into a unified format
3. Applies AI-powered and rule-based processing
4. Presents a unified, filterable feed to users

## Functional Requirements

### Content Sources

The system should support the following source types:

| Source Type | Input | Expected Behavior |
|-------------|-------|-------------------|
| **RSS** | RSS/Atom feed URL | Parse feed, extract items with title, description, link, pubDate |
| **YouTube** | YouTube channel/playlist RSS URL | Treat as RSS feed (YouTube provides RSS feeds) |
| **API** | REST API endpoint | Fetch JSON, apply optional transform function |
| **File** | File upload | Parse uploaded content (text, JSON, etc.) |

**Source Management:**

- Users can add, edit, enable/disable, and delete sources
- Each source has a configurable refresh rate (1, 10, or 60 minutes)
- Sources track their last fetch time and last attempt time
- Duplicate content from the same source should be detected and skipped

### Content Processing

**Workflow System:**

- Users can create named workflows with multiple processing steps
- Workflows can be enabled or disabled
- Steps execute sequentially in the defined order
- Each step can be individually enabled/disabled

**Processing Steps:**

| Step Type | Purpose | Configuration |
|-----------|---------|---------------|
| `ai-summarize` | Generate AI summary | `model`, `maxLength`, `temperature` |
| `ai-tag` | Generate AI tags | `model`, `maxTags` |
| `filter` | Filter content by rules | `rules` array |
| `transform` | Apply transformations | `transformations` array |

**Processing Flow:**

1. New content enters with `PENDING` status
2. Content progresses through enabled workflows
3. Status changes to `PROCESSING` during execution
4. On success: status → `COMPLETED`, processed data saved
5. On failure: status → `FAILED`, error recorded

### Background Jobs

**Scheduled Fetching:**

- A scheduler runs every minute
- It checks each source's `lastFetchedAt` against its `refreshRate`
- Due sources trigger fetch events
- Debouncing prevents excessive fetches (1-minute minimum gap)

**Event-Driven Processing:**

- Content processing is triggered after successful fetches
- Processing can also be triggered manually via API

### User Interface

**Feed View:**

- Display all processed content in a card-based feed
- Filter by source, status, search terms
- Show AI-generated summaries and tags
- Indicate processing status visually

**Source Management:**

- List all configured sources with status indicators
- Add new sources with type-specific configuration
- Edit existing sources
- Manual refresh trigger per source
- Bulk refresh all sources

**Workflow Management:**

- List all workflows
- Create new workflows with step builder
- Enable/disable workflows
- Edit workflow steps and configuration

### API Design

**REST Endpoints:**

All resources follow REST conventions:

- `GET /collection` — list all
- `POST /collection` — create new
- `GET /collection/:id` — get one
- `PATCH /collection/:id` — update
- `DELETE /collection/:id` — delete

**Additional Actions:**

- `POST /api/sources/:id/fetch` — trigger manual fetch
- `POST /api/sources/refresh-all` — refresh all sources
- `POST /api/process/:contentId` — process specific content

## Non-Functional Requirements

### Performance

- Background jobs should not block the UI
- Database queries should be efficient (use indexes)
- AI processing should handle rate limits gracefully

### Reliability

- Failed jobs should be retried with backoff
- Content fetch failures should not crash the scheduler
- Duplicate prevention should be robust

### Scalability

- Database should support SQLite (local) and Turso (production)
- Inngest provides cloud-based job scaling in production

### Developer Experience

- Local development should work with minimal setup
- Database migrations should be version-controlled
- Inngest dev server provides local job visibility

## Data Model

### Content Object

```typescript
interface ContentObject {
  id: string;
  sourceId: string;
  sourceType: 'RSS' | 'YOUTUBE' | 'API' | 'FILE';
  title: string;
  description?: string;
  url?: string;
  rawContent?: string;
  processedContent?: string;
  metadata?: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  type: 'ai-summarize' | 'ai-tag' | 'filter' | 'transform';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}
```

### Source

```typescript
interface Source {
  id: string;
  type: 'RSS' | 'YOUTUBE' | 'API' | 'FILE';
  name: string;
  url?: string;
  config?: Record<string, any>;
  enabled: boolean;
  refreshRate: number; // minutes
  lastFetchedAt?: Date;
  lastFetchAttempt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Points

### OpenAI

- Used for AI summarization and tagging steps
- Requires `OPENAI_API_KEY` environment variable
- Default model: `gpt-3.5-turbo`

### Inngest

- Background job orchestration
- Event-driven architecture
- Local dev server for development
- Cloud service for production

### Turso (Production Database)

- Edge-compatible SQLite
- Requires `DATABASE_URL` and `DATABASE_AUTH_TOKEN`
- Compatible with Drizzle ORM
