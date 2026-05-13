# Features

This document describes the features available in Content Feeder.

## Core Features

### Multi-Source Content Ingestion

Content Feeder aggregates content from multiple source types:

| Source Type | Description | Configuration |
|-------------|-------------|---------------|
| **RSS** | Standard RSS/Atom feeds | Feed URL |
| **YouTube** | YouTube channels via RSS | YouTube RSS URL |
| **API** | Generic REST API endpoints | Endpoint URL, headers, params |
| **File** | Manual file uploads | Allowed types, max size |

**Source Management:**

- Add new sources with type-specific configuration
- Enable/disable individual sources
- Set per-source refresh rates (1, 10, or 60 minutes)
- Manual fetch trigger for immediate content retrieval
- Bulk refresh all enabled sources

### AI-Powered Processing

Leverage OpenAI GPT models for intelligent content processing:

**AI Summarization:**

- Automatically generate concise summaries of content
- Configurable summary length
- Configurable model and temperature

**AI Tagging:**

- Automatically generate relevant tags/categories
- Configurable maximum number of tags
- Tags stored in content metadata

### Custom Workflows

Build custom processing pipelines:

**Workflow Builder:**

- Create named workflows with multiple steps
- Enable/disable entire workflows
- Enable/disable individual steps within workflows

**Available Steps:**

| Step | Purpose |
|------|---------|
| AI Summarize | Generate AI-powered summary |
| AI Tag | Generate AI-powered tags |
| Filter | Filter content based on rules |
| Transform | Apply custom transformations |

### Real-Time Feed

View and interact with processed content:

**Feed View:**

- Card-based content display
- Content title, description, and URL
- AI-generated summaries and tags
- Processing status indicators

**Filtering:**

- Filter by source
- Filter by processing status
- Search by keywords

### Background Processing

Automated content management:

**Scheduled Fetching:**

- Automatic content retrieval based on refresh rates
- Per-source scheduling (1, 10, 60 minute intervals)
- Debouncing to prevent excessive requests

**Event-Driven Processing:**

- Content automatically queued for processing after fetch
- Workflow execution tracked with job records
- Status updates throughout processing lifecycle

## Feature Details

### Source Configuration

**RSS Source:**

```json
{
  "type": "RSS",
  "name": "Tech News",
  "url": "https://example.com/feed.xml",
  "enabled": true,
  "refreshRate": 10
}
```

**YouTube Source:**

```json
{
  "type": "YOUTUBE",
  "name": "Tech Channel",
  "url": "https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID",
  "enabled": true,
  "refreshRate": 60
}
```

**API Source:**

```json
{
  "type": "API",
  "name": "News API",
  "url": "https://api.example.com/articles",
  "config": {
    "headers": { "Authorization": "Bearer TOKEN" },
    "params": { "limit": "10" }
  },
  "enabled": true,
  "refreshRate": 10
}
```

### Workflow Configuration

**Example Workflow:**

```json
{
  "name": "Standard Processing",
  "enabled": true,
  "steps": [
    {
      "id": "step_1",
      "type": "ai-summarize",
      "name": "Generate Summary",
      "config": {
        "model": "gpt-3.5-turbo",
        "maxLength": 150,
        "temperature": 0.7
      },
      "enabled": true
    },
    {
      "id": "step_2",
      "type": "ai-tag",
      "name": "Generate Tags",
      "config": {
        "model": "gpt-3.5-turbo",
        "maxTags": 5
      },
      "enabled": true
    }
  ]
}
```

### Content Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     Content Lifecycle                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Source Fetch                                                  │
│       │                                                         │
│       ▼                                                         │
│   ┌─────────┐                                                   │
│   │ PENDING │ ← New content enters system                       │
│   └────┬────┘                                                   │
│        │                                                        │
│        ▼                                                        │
│   ┌────────────┐                                                │
│   │ PROCESSING │ ← Content being processed through workflows    │
│   └─────┬──────┘                                                │
│         │                                                       │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ ┌───────────┐ ┌────────┐                                        │
│ │ COMPLETED │ │ FAILED │                                        │
│ └───────────┘ └────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Features

**Sources API:**

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/sources` | GET | List all sources |
| `/api/sources` | POST | Create new source |
| `/api/sources/:id` | GET | Get source details |
| `/api/sources/:id` | PATCH | Update source |
| `/api/sources/:id` | DELETE | Delete source |
| `/api/sources/:id/fetch` | POST | Trigger manual fetch |
| `/api/sources/refresh-all` | POST | Refresh all sources |

**Content API:**

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/content` | GET | List content (with filters) |
| `/api/content` | POST | Create content manually |
| `/api/content/:id` | GET | Get content details |
| `/api/content/:id` | PATCH | Update content |
| `/api/content/:id` | DELETE | Delete content |

**Workflows API:**

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/workflows` | GET | List all workflows |
| `/api/workflows` | POST | Create new workflow |
| `/api/workflows/:id` | GET | Get workflow details |
| `/api/workflows/:id` | PATCH | Update workflow |
| `/api/workflows/:id` | DELETE | Delete workflow |

**Processing API:**

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/process/:contentId` | POST | Process specific content |

## UI Features

### Main Navigation

- **Home/Feed**: View aggregated content
- **Sources**: Manage content sources
- **Workflows**: Configure processing workflows

### Feed Page

- Content cards with title, description, URL
- Status badges (Pending, Processing, Completed, Failed)
- AI-generated summary display
- AI-generated tags display
- Filter controls

### Sources Page

- Source list with enable/disable toggles
- Source type indicators
- Last fetched timestamp
- Manual refresh buttons
- Add new source form

### Workflows Page

- Workflow list with enable/disable toggles
- Step count display
- Last updated timestamp
- Workflow editor
