# Inngest Development Setup

This document explains how to run the Feeder application with Inngest background job processing.

## Quick Start

### Option 1: Run Everything Together (Recommended)
```bash
yarn dev:full
```

This will start both Next.js and Inngest development servers simultaneously.

### Option 2: Run Services Separately

**Terminal 1 - Next.js:**
```bash
yarn dev
```

**Terminal 2 - Inngest:**
```bash
yarn inngest:dev
```

## Development URLs

- **Next.js App**: http://localhost:3003
- **Inngest Dev Server**: http://localhost:8288
- **Inngest Functions**: http://localhost:8288/functions
- **Inngest Events**: http://localhost:8288/events

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start Next.js development server only |
| `yarn dev:full` | Start both Next.js and Inngest together |
| `yarn inngest:dev` | Start Inngest development server only |
| `yarn inngest:serve` | Start Inngest in serve mode (production-like) |

## Inngest Functions

The following Inngest functions are configured:

### 1. `fetch-source`
- **Event**: `app/source.fetch.requested`
- **Purpose**: Fetch content from a single source
- **Debounce**: 1-minute window to prevent excessive requests

### 2. `fetch-all-sources`
- **Event**: `app/sources.fetch.all.requested`
- **Purpose**: Batch fetch from all enabled sources
- **Usage**: Triggered manually or on page load

### 3. `process-content`
- **Event**: `app/content.process.requested`
- **Purpose**: Process pending content through workflows
- **Triggered**: Automatically after content is fetched

### 4. `schedule-source-fetches`
- **Schedule**: `* * * * *` (every minute)
- **Purpose**: Check and trigger fetches based on source refresh rates
- **Logic**: Respects per-source refresh rates (1, 10, 60 minutes)

## Configuration

### Local Development
- No API keys required
- Uses local Inngest development server
- All functions run locally
- Events are processed in real-time

### Environment Variables
```bash
# Database
DATABASE_URL=file:./local.db

# OpenAI (for AI processing)
OPENAI_API_KEY=your-openai-api-key-here

# Inngest (optional for local dev)
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

## Testing Inngest Functions

### Manual Event Triggering
You can trigger events manually using curl:

```bash
# Trigger single source fetch
curl -X POST http://localhost:3003/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "app/source.fetch.requested",
    "data": {
      "sourceId": "your-source-id",
      "isManual": true
    }
  }'

# Trigger all sources fetch
curl -X POST http://localhost:3003/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "app/sources.fetch.all.requested",
    "data": {}
  }'
```

### Using the Inngest Dev Server UI
1. Open http://localhost:8288
2. Navigate to the "Functions" tab
3. View function definitions and their triggers
4. Monitor function executions in real-time

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Next.js: Change port with `yarn dev -p 3004`
   - Inngest: Uses port 8288 by default

2. **Function Not Triggering**
   - Check that both servers are running
   - Verify the API route `/api/inngest` is accessible
   - Check browser console for errors

3. **Database Connection Issues**
   - Ensure `DATABASE_URL` is set correctly
   - Run `yarn db:migrate` to ensure schema is up to date

4. **Inngest CLI Not Found**
   - Run `yarn install` to ensure all dependencies are installed
   - Check that `inngest-cli` is in devDependencies

### Debug Mode

To run Inngest with verbose logging:
```bash
INNGEST_DEBUG=true yarn inngest:dev
```

## Production Deployment

For production deployment, you'll need to:

1. Set up Inngest Cloud account
2. Configure production environment variables
3. Deploy your Next.js app with the Inngest webhook
4. Update the Inngest configuration for production

See the [Inngest Documentation](https://www.inngest.com/docs) for production setup details.
