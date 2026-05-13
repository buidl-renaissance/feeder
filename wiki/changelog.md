# Changelog

This document tracks significant changes to Content Feeder.

## Recent Changes

### Initial Implementation (commit 1420d5c)

**Summary:** Complete implementation of the content aggregation platform.

**Added:**

- **Database Layer**
  - Drizzle ORM setup with SQLite/Turso support
  - Schema for sources, content, workflows, and processing_jobs tables
  - Database migrations

- **Source Connectors**
  - RSS feed connector with duplicate prevention
  - API endpoint connector
  - File upload connector
  - YouTube support via RSS connector
  - SourceConnectorFactory for connector instantiation

- **Processing Pipeline**
  - ContentProcessor for step execution
  - WorkflowEngine for workflow orchestration
  - AI Summarization step (OpenAI GPT)
  - AI Tagging step (OpenAI GPT)
  - Filter step
  - Transform step

- **Background Jobs (Inngest)**
  - fetch-source function
  - fetch-all-sources function
  - process-content function
  - schedule-source-fetches cron function
  - Debounce utilities

- **API Routes**
  - Sources CRUD endpoints
  - Content CRUD endpoints
  - Workflows CRUD endpoints
  - Processing trigger endpoint
  - Inngest webhook endpoint

- **Frontend**
  - Main layout with navigation
  - Feed view with content cards
  - Filter bar component
  - Source list and form components
  - Workflow list component

- **Documentation**
  - README with setup instructions
  - DEVELOPMENT.md guide
  - INNGEST_SETUP.md guide

### Initial Commit (commit 7d33948)

**Summary:** Next.js project scaffolding from Create Next App.

---

## Changelog Format

Future changes should follow this format:

```markdown
### Version X.Y.Z (date)

**Summary:** Brief description of the release.

**Added:**
- New feature descriptions

**Changed:**
- Modifications to existing functionality

**Fixed:**
- Bug fixes

**Removed:**
- Deprecated or removed features

**Security:**
- Security-related changes
```

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | Initial | Complete MVP implementation |

## Upcoming Changes

The following areas are candidates for future development:

- [ ] Real-time feed updates (WebSocket or polling)
- [ ] Pagination for content list
- [ ] OAuth support for authenticated API sources
- [ ] Additional source connectors (Twitter, Reddit, etc.)
- [ ] Parallel workflow execution
- [ ] Retry configuration for processing steps
- [ ] Content deduplication improvements
- [ ] User authentication and multi-tenancy
- [ ] Analytics dashboard
