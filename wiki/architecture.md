# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Feeder System                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐    │
│  │ Event Sources│     │ Content      │     │ Processing       │    │
│  │              │     │ Sources      │     │ Pipeline         │    │
│  │  - Luma      │     │  - RSS       │     │  - AI Summarize  │    │
│  │  - Meetup    │────▶│  - YouTube   │────▶│  - AI Tag        │    │
│  │  - RA        │     │  - API       │     │  - Filter        │    │
│  │              │     │  - File      │     │  - Transform     │    │
│  └──────────────┘     └──────────────┘     └──────────────────┘    │
│          │                   │                      │               │
│          ▼                   ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Inngest Background Jobs                   │   │
│  │                                                              │   │
│  │  - scheduled-event-poll (cron: every 2 hours)               │   │
│  │  - fetch-source (event-triggered)                           │   │
│  │  - fetch-all-sources (event-triggered)                      │   │
│  │  - process-content (event-triggered)                        │   │
│  │  - schedule-source-fetches (source refresh management)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│          │                                                          │
│          ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      SQLite Database                         │   │
│  │                                                              │   │
│  │  Tables: sources, content, workflows, processing_jobs       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Source Connectors (`src/lib/sources/`)

Each source type has a dedicated connector that implements the `SourceConnector` interface:

```
src/lib/sources/
├── base.ts           # Base SourceConnector class
├── event-base.ts     # EventSourceConnector base class
├── rss.ts            # RSS/Atom feed connector
├── api.ts            # Generic API connector
├── file.ts           # File upload connector
├── luma.ts           # Luma event connector
├── meetup.ts         # Meetup event connector
├── ra.ts             # Resident Advisor connector
└── index.ts          # SourceConnectorFactory
```

### Inngest Functions (`src/inngest/functions/`)

Background job handlers:

```
src/inngest/functions/
├── fetch-source.ts           # Fetch single source
├── fetch-all-sources.ts      # Fetch all enabled sources
├── process-content.ts        # Process content through workflows
├── schedule-source-fetches.ts # Manage source refresh schedules
└── scheduled-event-poll.ts   # Cron-based event polling
```

### Processing Pipeline (`src/lib/pipeline/`)

Workflow execution engine:

```
src/lib/pipeline/
├── workflow-engine.ts        # Main workflow orchestrator
├── processor.ts              # Content processor
└── steps/
    ├── ai-summarize.ts       # OpenAI summarization
    ├── ai-tag.ts             # AI tagging
    ├── filter.ts             # Content filtering
    └── transform.ts          # Content transformation
```

### Database (`src/db/`)

Drizzle ORM with SQLite:

```
src/db/
├── schema.ts                 # Table definitions
├── queries.ts                # Common queries
├── client.ts                 # Database client
└── migrations/               # Migration files
```

## Data Flow

### Event Polling Flow

```
1. Cron triggers scheduled-event-poll (every 2 hours)
2. Function queries enabled event sources due for refresh
3. For each source:
   a. Create appropriate connector (Luma/Meetup/RA)
   b. Fetch events from external API
   c. Normalize to EventObject schema
   d. Deduplicate against existing content
   e. Insert new events into database
   f. Update source lastFetchedAt timestamp
4. Log results and return summary
```

### Content Processing Flow

```
1. Event triggers process-content
2. Query pending content items
3. Query enabled workflows
4. For each content item:
   a. Update status to PROCESSING
   b. Execute each workflow in sequence
   c. Apply workflow steps (summarize, tag, etc.)
   d. Update content with results
   e. Set status to COMPLETED/FAILED
5. Return processing summary
```

## Database Schema

### sources

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| type | TEXT | RSS/YOUTUBE/API/FILE/LUMA/MEETUP/RA |
| name | TEXT | Display name |
| url | TEXT | Source URL |
| config | JSON | Type-specific configuration |
| enabled | BOOLEAN | Active status |
| refreshRate | INTEGER | Refresh interval (minutes) |
| lastFetchedAt | TIMESTAMP | Last successful fetch |
| lastFetchAttempt | TIMESTAMP | Last fetch attempt |
| lastError | TEXT | Last error message |
| consecutiveFailures | INTEGER | Failure count |

### content

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| sourceId | TEXT | Foreign key to sources |
| sourceType | TEXT | Source type |
| title | TEXT | Content title |
| description | TEXT | Content description |
| url | TEXT | Content URL |
| rawContent | TEXT | Original content |
| processedContent | TEXT | AI-processed content |
| metadata | JSON | Additional metadata |
| status | TEXT | PENDING/PROCESSING/COMPLETED/FAILED |
| publishedAt | TIMESTAMP | Publication date |
| externalId | TEXT | External platform ID |

## Scaling Considerations

### Current Architecture

- Single SQLite database (local development)
- Inngest for background jobs (managed or self-hosted)
- Next.js API routes for REST endpoints

### Production Scaling

1. **Database**: Migrate to Turso (distributed SQLite) or PostgreSQL
2. **Background Jobs**: Inngest Cloud with automatic scaling
3. **API**: Deploy to Vercel with Edge Functions
4. **Caching**: Add Redis for API response caching

## Security

### API Keys

All API keys are stored in environment variables:

- `OPENAI_API_KEY` - AI processing
- `LUMA_API_KEY` - Luma API access
- `MEETUP_API_KEY` - Meetup OAuth token
- `INNGEST_EVENT_KEY` - Inngest authentication
- `INNGEST_SIGNING_KEY` - Inngest webhook verification

### Data Validation

- Input validation via Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS prevention in React components
