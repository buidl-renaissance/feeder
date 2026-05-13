# Event Source Integrations

This document describes how to configure and use the event source connectors for Luma, Meetup, and Resident Advisor (RA).

## Overview

The Feeder supports polling events from three major event platforms:

- **Luma** (lu.ma) - Tech events, social gatherings, community meetups
- **Meetup** (meetup.com) - Community groups, tech meetups, social events
- **RA** (ra.co) - Music events, club nights, festivals

Events are automatically normalized to a common schema and stored in the content database with full metadata including venue, pricing, and RSVP information.

## Background Polling

Event sources are polled automatically via Inngest scheduled functions:

- **Cron Schedule**: Every 2 hours (`0 */2 * * *`)
- **Configurable per-source**: Each source can have its own `refreshRate` (in minutes)
- **Resilient**: Each source is polled independently; failures don't affect other sources
- **Deduplication**: Events are deduplicated by external ID, title, and URL

### Manual Polling

To trigger a manual poll, send an event to Inngest:

```javascript
await inngest.send({
  name: 'event/poll',
  data: {
    sourceId: 'optional-specific-source-id',
    sourceType: 'LUMA', // or 'MEETUP' or 'RA'
    forceRefresh: true  // bypass refresh rate limits
  }
});
```

## Luma Integration

### Configuration

Create a Luma source with the following config options:

```json
{
  "type": "LUMA",
  "name": "Detroit Tech Events",
  "config": {
    "calendarId": "cal-abc123",
    "username": "detroit-tech",
    "city": "Detroit",
    "apiKey": "optional-api-key"
  },
  "refreshRate": 120
}
```

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `calendarId` | string | Luma calendar API ID (from calendar URL) |
| `username` | string | Luma user/org username |
| `city` | string | City name for discover events |
| `apiKey` | string | Optional API key (env: `LUMA_API_KEY`) |

### Environment Variables

```bash
LUMA_API_KEY=your-api-key  # Optional, for authenticated requests
```

### API Endpoints Used

- `GET /public/v2/calendar/get-items` - Fetch calendar events
- `GET /public/v2/user/get-events` - Fetch user's events
- `GET /public/v2/discover/get-events` - Discover events by city

## Meetup Integration

### Configuration

Create a Meetup source with the following config options:

```json
{
  "type": "MEETUP",
  "name": "Detroit Tech Meetups",
  "config": {
    "groupUrlname": "detroit-tech-group",
    "topicCategory": "tech",
    "city": "Detroit",
    "radius": 50,
    "apiKey": "optional-api-key"
  },
  "refreshRate": 120
}
```

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `groupUrlname` | string | Meetup group URL name |
| `topicCategory` | string | Topic to search (tech, music, etc.) |
| `city` | string | City for geo-based search |
| `radius` | number | Search radius in miles (default: 50) |
| `apiKey` | string | OAuth access token (env: `MEETUP_API_KEY`) |

### Environment Variables

```bash
MEETUP_API_KEY=your-oauth-token  # For authenticated requests
```

### API Endpoints Used

- GraphQL API at `https://api.meetup.com/gql`
- Public GraphQL at `https://www.meetup.com/gql2` (fallback)

## Resident Advisor (RA) Integration

### Configuration

Create an RA source with the following config options:

```json
{
  "type": "RA",
  "name": "Detroit Electronic Music",
  "config": {
    "areaId": "23",
    "clubId": "12345",
    "city": "Detroit"
  },
  "refreshRate": 240
}
```

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `areaId` | string | RA area/region ID |
| `clubId` | string | Specific venue/club ID |
| `city` | string | City name (auto-maps to area ID) |

### Known Area IDs

| City | Area ID |
|------|---------|
| Detroit | 23 |
| New York | 8 |
| Los Angeles | 12 |
| Chicago | 14 |
| London | 13 |
| Berlin | 34 |
| Amsterdam | 29 |
| Ibiza | 25 |
| Miami | 11 |

### API Endpoints Used

- GraphQL API at `https://ra.co/graphql`

## Event Schema

All events are normalized to this schema:

```typescript
interface EventObject {
  externalId: string;     // e.g., "luma_abc123", "meetup_456", "ra_789"
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  startTime: Date;
  endTime?: Date;
  timezone?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  organizer?: {
    name: string;
    url?: string;
  };
  categories?: string[];
  ticketUrl?: string;
  price?: {
    min?: number;
    max?: number;
    currency?: string;
    isFree?: boolean;
  };
  capacity?: number;
  rsvpCount?: number;
  source: 'LUMA' | 'MEETUP' | 'RA';
}
```

## Error Handling

Each source connector handles errors gracefully:

- **Authentication errors**: Logged and source marked with error
- **Rate limiting**: Respected with exponential backoff
- **Network errors**: Retried up to 3 times
- **API changes**: Logged for investigation

Failed sources don't affect other sources in the polling cycle.

### Monitoring Failures

Check source health via API:

```bash
GET /api/sources
```

Sources with errors will have:
- `lastError`: Description of the last error
- `consecutiveFailures`: Count of consecutive failures

## Adding a New Event Source

1. Add to `SourceType` enum in `src/types/content.ts`
2. Add config interface in `src/types/content.ts`
3. Create connector in `src/lib/sources/`
4. Register in `SourceConnectorFactory`
5. Update database schema types
6. Add to `EVENT_SOURCE_TYPES` in scheduled poll function
7. Document in this wiki

## Troubleshooting

### Events not appearing

1. Check source is enabled: `GET /api/sources/{id}`
2. Check for errors in `lastError` field
3. Verify Inngest is running: `yarn inngest:dev`
4. Check Inngest dashboard for function executions

### Duplicate events

Events are deduplicated by:
1. External ID (e.g., `luma_abc123`)
2. Title + Source ID
3. URL + Source ID

If duplicates persist, check the `externalId` is being set correctly.

### API rate limits

- Luma: ~100 requests/minute
- Meetup: ~30 requests/minute (authenticated)
- RA: ~60 requests/minute

Adjust `refreshRate` if hitting limits frequently.
