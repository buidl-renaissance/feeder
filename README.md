# Content Feeder

A full-stack content aggregation platform that ingests content from multiple sources (RSS, APIs, file uploads, **event platforms**), processes it through AI/LLM pipelines and custom workflows, and presents it in user-facing feeds.

📚 **[Full Documentation](wiki/README.md)**

## Features

- **Multi-source Content Ingestion**: RSS feeds, API endpoints, file uploads, and event platforms
- **Event Platform Integration**: Automatic polling from Luma, Meetup, and Resident Advisor
- **AI-Powered Processing**: Automatic summarization, tagging, and sentiment analysis
- **Custom Workflows**: Build custom processing pipelines with visual workflow builder
- **Real-time Feeds**: Filter, search, and view processed content
- **Background Processing**: Automated content fetching via Inngest cron jobs
- **Modern UI**: Built with Next.js and styled-components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, styled-components
- **Backend**: Next.js API routes, Drizzle ORM
- **Database**: SQLite (local) / Turso (production)
- **Background Jobs**: Inngest
- **AI/LLM**: OpenAI GPT models
- **Content Sources**: RSS parser, Luma, Meetup, Resident Advisor APIs

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd feeder
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your configuration:
```env
# Database (SQLite for local development)
DATABASE_URL=file:./local.db

# OpenAI API Key (required for AI processing)
OPENAI_API_KEY=your-openai-api-key
```

4. Set up the database:
```bash
# Generate database migrations
yarn db:generate

# Run migrations
yarn db:migrate
```

5. Start the development server:
```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Adding Sources

1. Navigate to the Sources page
2. Click "Add Source"
3. Choose source type:
   - **RSS**: Subscribe to any RSS/Atom feed
   - **API**: Connect to custom API endpoints
   - **File**: Upload content files
   - **Luma**: Poll events from lu.ma
   - **Meetup**: Poll events from meetup.com
   - **RA**: Poll events from Resident Advisor
4. Configure the source with appropriate settings
5. Enable the source to start automatic fetching

For event sources, see [Event Sources Documentation](wiki/event-sources.md).

### Creating Workflows

1. Go to the Workflows page
2. Create custom processing workflows with steps like:
   - AI Summarization
   - AI Tagging
   - Content Filtering
   - Custom Transformations

### Viewing Content

The main feed displays all processed content with:
- Filtering by source, status, and search terms
- Real-time updates
- AI-generated summaries and tags
- Status indicators for processing state

## API Endpoints

### Sources
- `GET /api/sources` - List all sources
- `POST /api/sources` - Create a new source
- `GET /api/sources/[id]` - Get source by ID
- `PATCH /api/sources/[id]` - Update source
- `DELETE /api/sources/[id]` - Delete source
- `POST /api/sources/[id]/fetch` - Manually fetch from source

### Content
- `GET /api/content` - List content with filtering
- `POST /api/content` - Create content manually
- `GET /api/content/[id]` - Get content by ID
- `PATCH /api/content/[id]` - Update content
- `DELETE /api/content/[id]` - Delete content

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create a new workflow
- `GET /api/workflows/[id]` - Get workflow by ID
- `PATCH /api/workflows/[id]` - Update workflow
- `DELETE /api/workflows/[id]` - Delete workflow

### Processing
- `POST /api/process/[contentId]` - Process content through workflows

## Database Schema

The application uses the following main tables:

- **sources**: Content source configurations
- **content**: Aggregated content items
- **workflows**: Processing workflow definitions
- **processing_jobs**: Job execution tracking

## Development

### Database Management

```bash
# Generate migrations after schema changes
yarn db:generate

# Apply migrations
yarn db:migrate

# Open Drizzle Studio (database GUI)
yarn db:studio
```

### Background Jobs

The application uses Inngest for background job processing:

- **Event Polling**: Polls Luma, Meetup, and RA sources every 2 hours
- **Content Processing**: Processes pending content through workflows
- **Source Refresh**: Respects per-source refresh rate settings

To run background jobs locally:

```bash
# Start Next.js + Inngest together
yarn dev:full

# Or run separately
yarn dev          # Terminal 1
yarn inngest:dev  # Terminal 2
```

Jobs can be triggered manually via API endpoints or the Inngest dashboard.

## Deployment

### Environment Variables

For production deployment, set these environment variables:

```env
# Database (use Turso for production)
DATABASE_URL=libsql://your-database-url.turso.io
DATABASE_AUTH_TOKEN=your-auth-token

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Inngest (for background jobs)
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key

# Event Source APIs (optional, for authenticated access)
LUMA_API_KEY=your-luma-api-key
MEETUP_API_KEY=your-meetup-oauth-token
```

### Build and Deploy

```bash
# Build the application
yarn build

# Start production server
yarn start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.