# Feeder Development Guide

This guide covers the complete development workflow for the Feeder content aggregation system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn package manager
- SQLite database (automatically created)

### Initial Setup
```bash
# Install dependencies
yarn install

# Set up database
yarn db:migrate

# Start development environment
yarn dev:full
```

## 📋 Available Scripts

### Development
| Script | Description |
|--------|-------------|
| `yarn dev` | Start Next.js only |
| `yarn dev:full` | Start Next.js + Inngest together |
| `yarn inngest:dev` | Start Inngest dev server only |

### Database
| Script | Description |
|--------|-------------|
| `yarn db:generate` | Generate new migration |
| `yarn db:migrate` | Run pending migrations |
| `yarn db:studio` | Open Drizzle Studio |

### Testing
| Script | Description |
|--------|-------------|
| `yarn test:inngest` | Test Inngest setup |

## 🏗️ Architecture Overview

### Core Components

1. **Content Sources** (`src/lib/sources/`)
   - RSS feeds
   - YouTube channels
   - API endpoints
   - File uploads

2. **Processing Pipeline** (`src/lib/pipeline/`)
   - AI summarization
   - Content tagging
   - Filtering and transformation
   - Workflow orchestration

3. **Background Jobs** (`src/inngest/functions/`)
   - Scheduled content fetching
   - Content processing
   - Debounce management

4. **Database Layer** (`src/db/`)
   - Drizzle ORM with SQLite
   - Schema management
   - Query utilities

## 🔄 Development Workflow

### 1. Content Source Development

**Adding a new source type:**
1. Create connector in `src/lib/sources/`
2. Update `SourceConnectorFactory`
3. Add to `SourceType` enum
4. Update API schemas

**Example:**
```typescript
// src/lib/sources/twitter.ts
export class TwitterConnector extends BaseConnector {
  async fetch(): Promise<ContentObject[]> {
    // Implementation
  }
}
```

### 2. Processing Pipeline Development

**Adding a new processing step:**
1. Create step in `src/lib/pipeline/steps/`
2. Register in workflow engine
3. Update database schema if needed

**Example:**
```typescript
// src/lib/pipeline/steps/sentiment-analysis.ts
export class SentimentAnalysisStep implements ProcessingStep {
  async process(content: ContentObject): Promise<ContentObject> {
    // Implementation
  }
}
```

### 3. Background Job Development

**Adding a new Inngest function:**
1. Create function in `src/inngest/functions/`
2. Register in `src/pages/api/inngest.ts`
3. Test with Inngest dev server

**Example:**
```typescript
// src/inngest/functions/my-function.ts
export const myFunction = inngest.createFunction(
  { id: 'my-function' },
  { event: 'app/my.event' },
  async ({ event, step }) => {
    // Implementation
  }
);
```

## 🧪 Testing

### Manual Testing

1. **Test Content Fetching:**
   ```bash
   # Run fetch job
   yarn run-fetch-job
   ```

2. **Test Content Processing:**
   ```bash
   # Run processing job
   yarn run-process-job
   ```

3. **Test Inngest Functions:**
   ```bash
   # Test Inngest setup
   yarn test:inngest
   ```

### Database Testing

```bash
# Test database connection
yarn test-db

# Open database studio
yarn db:studio
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
DATABASE_URL=file:./local.db
OPENAI_API_KEY=your-openai-api-key-here
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

### Database Schema

The database schema is defined in `src/db/schema.ts`:

- **sources**: Content source configurations
- **content**: Fetched content items
- **workflows**: Processing workflow definitions
- **processing_jobs**: Job execution history

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Reset database
   rm local.db
   yarn db:migrate
   ```

2. **Inngest Functions Not Triggering**
   - Check both servers are running
   - Verify `/api/inngest` endpoint
   - Check Inngest dev server UI

3. **Content Fetching Failures**
   - Check source URLs are valid
   - Verify network connectivity
   - Check debounce settings

4. **AI Processing Issues**
   - Verify OpenAI API key
   - Check API rate limits
   - Monitor processing logs

### Debug Mode

```bash
# Enable verbose logging
INNGEST_DEBUG=true yarn inngest:dev

# Check database
yarn db:studio
```

## 📊 Monitoring

### Inngest Dev Server
- **URL**: http://localhost:8288
- **Functions**: View registered functions
- **Events**: Monitor event processing
- **Logs**: Real-time execution logs

### Database Studio
- **URL**: http://localhost:4983 (when running `yarn db:studio`)
- **Tables**: Browse database tables
- **Queries**: Run custom queries
- **Data**: View and edit records

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   DATABASE_URL=your-production-db-url
   OPENAI_API_KEY=your-production-key
   INNGEST_EVENT_KEY=your-production-key
   INNGEST_SIGNING_KEY=your-production-key
   ```

2. **Database Migration**
   ```bash
   yarn db:migrate
   ```

3. **Build and Deploy**
   ```bash
   yarn build
   yarn start
   ```

### Inngest Production

1. Set up Inngest Cloud account
2. Configure production webhook
3. Update environment variables
4. Deploy with Inngest integration

## 📚 Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Styled Components](https://styled-components.com/docs)
