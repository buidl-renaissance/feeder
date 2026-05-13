# AGENTS

This document provides context for AI assistants working on the Content Feeder codebase.

## Quick Orientation

**What is this?** A full-stack content aggregation platform built with Next.js 15, React 19, and TypeScript.

**What does it do?** Ingests content from multiple sources (RSS, API, File), processes it through AI/LLM pipelines, and presents it in a user-facing feed.

**Key technologies:** Next.js, Drizzle ORM, SQLite/Turso, Inngest, OpenAI, styled-components

## Repository Structure

```
/workspace/
├── src/
│   ├── components/      # React UI components
│   ├── db/              # Database schema, client, queries
│   ├── inngest/         # Background job definitions
│   ├── lib/             # Core business logic
│   │   ├── pipeline/    # Processing pipeline and steps
│   │   ├── sources/     # Source connectors
│   │   └── utils/       # Utility functions
│   ├── pages/           # Next.js pages and API routes
│   ├── styles/          # CSS files
│   └── types/           # TypeScript type definitions
├── scripts/             # Utility scripts
├── wiki/                # This documentation
└── [config files]
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Database table definitions |
| `src/types/content.ts` | Core TypeScript interfaces |
| `src/lib/sources/base.ts` | Source connector base class |
| `src/lib/pipeline/processor.ts` | Content processing logic |
| `src/inngest/functions/*.ts` | Background job definitions |
| `src/pages/api/**/*.ts` | REST API endpoints |

## Common Tasks

### Adding a New Source Type

1. Create connector in `src/lib/sources/new-type.ts` extending `SourceConnector`
2. Implement `fetch()` and `getSourceType()` methods
3. Register in `SourceConnectorFactory` (`src/lib/sources/index.ts`)
4. Add to `SourceType` enum (`src/types/content.ts`)
5. Update database schema if needed (`src/db/schema.ts`)

### Adding a New Processing Step

1. Create step in `src/lib/pipeline/steps/new-step.ts`
2. Implement `process(content: ContentObject)` method
3. Register in `ContentProcessor` (`src/lib/pipeline/processor.ts`)
4. Add to `WorkflowStep.type` union (`src/types/content.ts`)

### Adding a New API Endpoint

1. Create route file in `src/pages/api/`
2. Export handler function with method checks
3. Use database queries from `src/db/queries.ts`
4. Follow existing patterns for error handling

### Adding a New Inngest Function

1. Create function in `src/inngest/functions/`
2. Define event type and handler
3. Register in `src/pages/api/inngest.ts`

## Development Commands

```bash
yarn dev:full     # Start everything for development
yarn db:migrate   # Apply database migrations
yarn db:studio    # Open database GUI
```

## Architecture Patterns

**Source Connectors:** Factory pattern with abstract base class

**Processing Pipeline:** Strategy pattern for steps, sequential execution

**Background Jobs:** Event-driven with Inngest, cron for scheduling

**Database:** Repository pattern with Drizzle ORM

## Important Conventions

- Use `yarn` for package management (not npm)
- Use styled-components for styling (not CSS modules)
- API routes follow REST conventions
- TypeScript strict mode is enabled
- Database uses SQLite locally, Turso in production

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Database connection string |
| `OPENAI_API_KEY` | For AI | OpenAI API key |
| `DATABASE_AUTH_TOKEN` | Production | Turso auth token |
| `INNGEST_*` | Production | Inngest credentials |

## Testing

Currently no automated test suite. Manual testing:

```bash
yarn test:inngest  # Test Inngest setup
yarn db:studio     # Inspect database
```

## Common Issues

**"Database not found":** Run `yarn db:migrate`

**"Inngest functions not triggering":** Ensure both Next.js and Inngest servers are running (`yarn dev:full`)

**"AI processing fails silently":** Check `OPENAI_API_KEY` is set

**"Duplicate content appearing":** Check `createContentWithDuplicatePrevention` in source connectors

## Related Documentation

- [Overview](./overview.md) — High-level system description
- [Architecture](./architecture.md) — Technical architecture details
- [Specification](./spec.md) — Intended functionality
- [Current State](./current-state.md) — What's implemented now
- [Features](./features.md) — Feature breakdown
- [Tools](./tools.md) — Dependencies and tooling

## For More Help

- Main README: `/workspace/README.md`
- Development Guide: `/workspace/DEVELOPMENT.md`
- Inngest Setup: `/workspace/INNGEST_SETUP.md`
