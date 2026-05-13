# Tools & Integrations

## Inngest

Inngest handles all background job processing in the Feeder.

### Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `scheduled-event-poll` | Cron: `0 */2 * * *` | Polls all event sources every 2 hours |
| `manual-event-poll` | Event: `event/poll` | Manual trigger for event polling |
| `fetch-source` | Event: `source/fetch` | Fetch single source |
| `fetch-all-sources` | Event: `source/fetch-all` | Fetch all enabled sources |
| `process-content` | Event: `content/process` | Process content through workflows |
| `schedule-source-fetches` | Event: `source/schedule` | Schedule recurring fetches |

### Local Development

```bash
# Start Inngest dev server
yarn inngest:dev

# Or run with Next.js
yarn dev:full
```

### Production Deployment

1. Create account at [inngest.com](https://inngest.com)
2. Set environment variables:
   ```bash
   INNGEST_EVENT_KEY=your-event-key
   INNGEST_SIGNING_KEY=your-signing-key
   ```
3. Deploy Next.js app with `/api/inngest` endpoint

## Drizzle ORM

Database management using Drizzle ORM with SQLite.

### Commands

```bash
# Generate migrations
yarn db:generate

# Run migrations
yarn db:migrate

# Open Drizzle Studio
yarn db:studio
```

### Schema Location

`src/db/schema.ts`

## OpenAI

AI-powered content processing.

### Features

- Content summarization
- Automatic tagging
- Sentiment analysis

### Configuration

```bash
OPENAI_API_KEY=your-api-key
```

## Event Platform APIs

### Luma API

- **Base URL**: `https://api.lu.ma/public/v2`
- **Authentication**: Optional API key
- **Rate Limit**: ~100 requests/minute

### Meetup GraphQL API

- **URL**: `https://api.meetup.com/gql`
- **Authentication**: OAuth 2.0 (optional for public data)
- **Rate Limit**: ~30 requests/minute (authenticated)

### Resident Advisor GraphQL API

- **URL**: `https://ra.co/graphql`
- **Authentication**: None required
- **Rate Limit**: ~60 requests/minute

## RSS Parser

Built-in RSS/Atom feed parsing using `rss-parser`.

### Supported Formats

- RSS 2.0
- Atom 1.0
- RSS 1.0

### Features

- Custom field extraction
- Date parsing
- Encoding detection

## Development Tools

### ESLint

```bash
yarn lint
```

### TypeScript

Strict mode enabled with full type checking.

### Turbopack

Next.js 15 with Turbopack for fast development builds.

## API Endpoints

### Sources

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sources` | GET | List all sources |
| `/api/sources` | POST | Create source |
| `/api/sources/[id]` | GET | Get source |
| `/api/sources/[id]` | PATCH | Update source |
| `/api/sources/[id]` | DELETE | Delete source |
| `/api/sources/[id]/fetch` | POST | Manual fetch |
| `/api/sources/refresh-all` | POST | Refresh all sources |

### Content

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content` | GET | List content |
| `/api/content` | POST | Create content |
| `/api/content/[id]` | GET | Get content |
| `/api/content/[id]` | PATCH | Update content |
| `/api/content/[id]` | DELETE | Delete content |

### Workflows

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workflows` | GET | List workflows |
| `/api/workflows` | POST | Create workflow |
| `/api/workflows/[id]` | GET | Get workflow |
| `/api/workflows/[id]` | PATCH | Update workflow |
| `/api/workflows/[id]` | DELETE | Delete workflow |

### Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process/[contentId]` | POST | Process content |
