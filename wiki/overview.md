# Overview

Content Feeder is a full-stack content aggregation platform built with Next.js 15 and React 19. It ingests content from multiple sources (RSS feeds, YouTube channels, API endpoints, file uploads), processes that content through configurable AI/LLM pipelines, and presents the results in a user-facing feed.

## Purpose

The system is designed to:

1. **Aggregate** content from diverse sources into a unified feed
2. **Process** content using AI (summarization, tagging) and custom transformations
3. **Present** a filterable, searchable feed of processed content
4. **Automate** recurring fetch and processing tasks via background jobs

## Key Files and Directories

### Source Connectors (`src/lib/sources/`)

| File | Purpose |
|------|---------|
| `base.ts` | Abstract `SourceConnector` base class defining the connector interface |
| `rss.ts` | RSS feed connector using `rss-parser` |
| `api.ts` | Generic API endpoint connector |
| `file.ts` | File upload connector |
| `index.ts` | `SourceConnectorFactory` for creating connectors by type |

### Processing Pipeline (`src/lib/pipeline/`)

| File | Purpose |
|------|---------|
| `processor.ts` | `ContentProcessor` class that runs content through workflow steps |
| `workflow-engine.ts` | `WorkflowEngine` orchestrates workflow execution and job tracking |
| `steps/ai-summarize.ts` | OpenAI-powered summarization step |
| `steps/ai-tag.ts` | OpenAI-powered tagging step |
| `steps/filter.ts` | Content filtering step |
| `steps/transform.ts` | Content transformation step |

### Background Jobs (`src/inngest/`)

| File | Purpose |
|------|---------|
| `client.ts` | Inngest client configuration |
| `functions/fetch-source.ts` | Fetch content from a single source |
| `functions/fetch-all-sources.ts` | Batch fetch from all enabled sources |
| `functions/process-content.ts` | Process pending content through workflows |
| `functions/schedule-source-fetches.ts` | Cron-based scheduler respecting per-source refresh rates |

### Database (`src/db/`)

| File | Purpose |
|------|---------|
| `schema.ts` | Drizzle ORM schema definitions for all tables |
| `client.ts` | Database client initialization |
| `queries.ts` | Reusable database query functions |
| `migrations/` | SQL migration files |

### API Routes (`src/pages/api/`)

| Route | Purpose |
|-------|---------|
| `/api/sources/*` | CRUD operations for content sources |
| `/api/content/*` | CRUD operations for content items |
| `/api/workflows/*` | CRUD operations for workflow definitions |
| `/api/process/[contentId]` | Trigger content processing |
| `/api/inngest` | Inngest webhook endpoint |

### Frontend Components (`src/components/`)

| Directory | Purpose |
|-----------|---------|
| `Feed/` | Feed display, filtering, and content cards |
| `Sources/` | Source management forms and lists |
| `Workflows/` | Workflow builder and management |
| `Layout.tsx` | Main application layout and navigation |

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Feed View  │  │   Sources   │  │  Workflows  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Routes (Next.js)                    │
│   /api/sources  │  /api/content  │  /api/workflows         │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Source Connectors│  │ Processing      │  │   Database      │
│ (RSS, API, File)│  │ Pipeline        │  │   (SQLite/Turso)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │
          └─────────┬─────────┘
                    ▼
        ┌─────────────────────┐
        │   Inngest (Jobs)    │
        │ ┌─────────────────┐ │
        │ │ fetch-source    │ │
        │ │ process-content │ │
        │ │ scheduler       │ │
        │ └─────────────────┘ │
        └─────────────────────┘
```

See [architecture.md](./architecture.md) for detailed component documentation.
