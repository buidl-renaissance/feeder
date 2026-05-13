# Features

## Content Aggregation

### Multi-Source Ingestion

The Feeder supports multiple content source types:

- **RSS Feeds**: Subscribe to any RSS/Atom feed
- **YouTube Channels**: Fetch videos via RSS
- **API Endpoints**: Connect to any JSON API
- **File Uploads**: Import content from files
- **Event Platforms**: Luma, Meetup, Resident Advisor

### Background Polling

All sources are polled automatically in the background:

- Configurable refresh rates per source (1 minute to 24 hours)
- Cron-scheduled polling for event sources (every 2 hours)
- Resilient design - source failures don't affect other sources
- Automatic retry with exponential backoff

### Duplicate Prevention

Content is automatically deduplicated using multiple strategies:

- External ID matching (for events)
- Title + Source combination
- URL + Source combination
- Cross-source title + URL matching

## Processing Pipeline

### AI-Powered Processing

- **Summarization**: Automatic content summaries via OpenAI
- **Tagging**: AI-generated tags and categories
- **Sentiment Analysis**: Content sentiment scoring

### Custom Workflows

Build custom processing pipelines with:

- Sequential step execution
- Conditional processing
- Custom transformations
- Filter rules

## Event Management

### Event Sources

- **Luma**: Tech events, community meetups
- **Meetup**: Group events, social gatherings  
- **Resident Advisor**: Music events, club nights

### Event Features

- Normalized event schema across all sources
- Venue information with coordinates
- Pricing and ticket information
- RSVP/attendance counts
- Organizer details

## API

### RESTful Endpoints

- Sources: CRUD operations, manual fetch triggers
- Content: List, filter, search
- Workflows: Pipeline management
- Processing: Trigger content processing

### Inngest Integration

Background job processing via Inngest:

- Scheduled polling
- Content processing
- Workflow execution

## User Interface

### Feed View

- Real-time content updates
- Filter by source, status, type
- Search functionality
- Pagination

### Source Management

- Add/edit/delete sources
- Manual fetch triggers
- Source health monitoring

### Workflow Builder

- Visual workflow creation
- Step configuration
- Enable/disable workflows
