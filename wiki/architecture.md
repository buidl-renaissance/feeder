# Architecture

This document describes the technical architecture of Content Feeder.

## High-Level Architecture

Content Feeder follows a standard Next.js application pattern with additional layers for content ingestion and processing:

```
┌──────────────────────────────────────────────────────────────────────┐
│                           User Interface                             │
│   Next.js Pages + React Components + styled-components               │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           API Layer                                  │
│   Next.js API Routes (/api/sources, /api/content, /api/workflows)   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│   Source       │        │   Processing   │        │   Database     │
│   Connectors   │        │   Pipeline     │        │   Layer        │
│                │        │                │        │                │
│ • RSS          │        │ • AI Summarize │        │ • Drizzle ORM  │
│ • API          │        │ • AI Tag       │        │ • SQLite/Turso │
│ • File         │        │ • Filter       │        │ • Migrations   │
│ • YouTube      │        │ • Transform    │        │                │
└────────────────┘        └────────────────┘        └────────────────┘
        │                           │
        └───────────────┬───────────┘
                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Background Jobs                               │
│   Inngest Functions (fetch-source, process-content, scheduler)      │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Source Connectors

Location: `src/lib/sources/`

Source connectors are responsible for fetching content from external sources. All connectors extend the abstract `SourceConnector` base class.

**Base Class Interface:**

```typescript
abstract class SourceConnector {
  abstract fetch(): Promise<ContentObject[]>;
  abstract getSourceType(): SourceType;
  protected normalizeContent(rawData: any): ContentObject;
}
```

**Available Connectors:**

| Connector | Source Type | Description |
|-----------|-------------|-------------|
| `RSSConnector` | RSS, YOUTUBE | Parses RSS/Atom feeds using `rss-parser` |
| `APIConnector` | API | Fetches from generic REST API endpoints |
| `FileConnector` | FILE | Handles file uploads |

**Factory Pattern:**

The `SourceConnectorFactory` creates the appropriate connector based on source type:

```typescript
SourceConnectorFactory.create(SourceType.RSS, sourceId, config);
```

### 2. Processing Pipeline

Location: `src/lib/pipeline/`

The processing pipeline transforms raw content through configurable steps.

**ContentProcessor:**

Executes individual workflow steps sequentially:

```typescript
class ContentProcessor {
  async processContent(content: ContentObject, steps: WorkflowStep[]): Promise<ProcessingResult>;
}
```

**WorkflowEngine:**

Orchestrates complete workflow execution with job tracking:

```typescript
class WorkflowEngine {
  async executeWorkflow(content: ContentObject, workflow: Workflow): Promise<{
    success: boolean;
    result?: ContentObject;
    jobId?: string;
  }>;
}
```

**Pipeline Steps:**

| Step | Purpose |
|------|---------|
| `ai-summarize` | Generate AI summary using OpenAI GPT |
| `ai-tag` | Generate AI tags/categories |
| `filter` | Filter content based on rules |
| `transform` | Apply custom transformations |

### 3. Database Layer

Location: `src/db/`

Uses Drizzle ORM with SQLite (local) or Turso (production).

**Schema Tables:**

| Table | Purpose |
|-------|---------|
| `sources` | Content source configurations |
| `content` | Fetched and processed content items |
| `workflows` | Processing workflow definitions |
| `processing_jobs` | Job execution history |

**Key Relationships:**

- `content.sourceId` → `sources.id`
- `processing_jobs.contentId` → `content.id`
- `processing_jobs.workflowId` → `workflows.id`

### 4. Background Jobs (Inngest)

Location: `src/inngest/`

Inngest handles background job processing with built-in retry, scheduling, and observability.

**Functions:**

| Function | Trigger | Purpose |
|----------|---------|---------|
| `fetch-source` | `source/fetch` event | Fetch from a single source |
| `fetch-all-sources` | `sources/fetch-all` event | Batch fetch from all sources |
| `process-content` | `content/process` event | Process pending content |
| `schedule-source-fetches` | Cron (`* * * * *`) | Scheduler respecting refresh rates |

**Job Flow:**

1. Scheduler checks which sources need fetching based on `refreshRate`
2. Emits `source/fetch` events for due sources
3. `fetch-source` fetches content and saves to database
4. `process-content` processes pending items through workflows

### 5. API Routes

Location: `src/pages/api/`

RESTful API routes for all CRUD operations.

**Route Structure:**

```
/api/sources              GET, POST
/api/sources/[id]         GET, PATCH, DELETE
/api/sources/[id]/fetch   POST
/api/sources/[id]/refresh POST
/api/sources/refresh-all  POST

/api/content              GET, POST
/api/content/[id]         GET, PATCH, DELETE

/api/workflows            GET, POST
/api/workflows/[id]       GET, PATCH, DELETE

/api/process/[contentId]  POST
/api/inngest              POST (webhook)
```

### 6. Frontend Components

Location: `src/components/`

React components styled with styled-components.

**Component Structure:**

```
components/
├── Layout.tsx              # Main layout with navigation
├── Feed/
│   ├── FeedView.tsx        # Main feed display
│   ├── ContentCard.tsx     # Individual content item
│   └── FilterBar.tsx       # Filtering controls
├── Sources/
│   ├── SourceList.tsx      # List of configured sources
│   └── SourceForm.tsx      # Add/edit source form
└── Workflows/
    └── WorkflowList.tsx    # Workflow management
```

## Data Flow

### Content Ingestion Flow

```
1. User adds Source → API saves to DB
2. Scheduler runs every minute
3. Scheduler checks source.refreshRate vs lastFetchedAt
4. Due sources → emit fetch events
5. Fetch function calls SourceConnector.fetch()
6. Raw content saved to DB with status=PENDING
7. Process event emitted
8. Content processed through enabled workflows
9. Processed content saved with status=COMPLETED
```

### Content Processing Flow

```
1. Content item with status=PENDING
2. Load enabled workflows from DB
3. For each workflow:
   a. Create processing job record
   b. Execute each enabled step in order
   c. Update job status on completion/failure
4. Update content.status to COMPLETED/FAILED
5. Save processedContent and metadata
```

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | SQLite file path or Turso URL | `file:./local.db` |
| `DATABASE_AUTH_TOKEN` | Turso auth token | (none) |
| `OPENAI_API_KEY` | OpenAI API key for AI steps | (required for AI) |
| `INNGEST_EVENT_KEY` | Inngest event key | (optional for dev) |
| `INNGEST_SIGNING_KEY` | Inngest signing key | (optional for dev) |

### Source Configuration

Each source has a `config` JSON field for type-specific settings:

```typescript
// RSS source
{ url: "https://example.com/feed.xml" }

// API source
{ endpoint: "https://api.example.com/items", headers: { ... } }

// File source
{ allowedTypes: ["text/plain"], maxSize: 1048576 }
```

### Workflow Configuration

Workflows contain an array of steps with individual configs:

```typescript
{
  id: "workflow_1",
  name: "Default Processing",
  steps: [
    { type: "ai-summarize", config: { maxLength: 150 }, enabled: true },
    { type: "ai-tag", config: { maxTags: 5 }, enabled: true }
  ],
  enabled: true
}
```
