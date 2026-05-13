# Tools and Dependencies

This document describes the technologies, dependencies, and external integrations used in Content Feeder.

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.6 | React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | ^5 | Type-safe JavaScript |
| styled-components | ^6.1.19 | CSS-in-JS styling |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.5.6 | REST API endpoints |
| Drizzle ORM | ^0.44.6 | Database ORM |
| better-sqlite3 | ^12.4.1 | SQLite driver (local dev) |
| @libsql/client | ^0.15.15 | Turso/LibSQL driver (production) |

### Background Jobs

| Technology | Version | Purpose |
|------------|---------|---------|
| Inngest | ^3.44.3 | Event-driven job orchestration |
| inngest-cli | ^1.12.1 | Local development server |

### AI/ML

| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI SDK | ^6.5.0 | GPT API integration |

### Content Parsing

| Technology | Version | Purpose |
|------------|---------|---------|
| rss-parser | ^3.13.0 | RSS/Atom feed parsing |

### Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| Zod | ^4.1.12 | Runtime schema validation |

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | ^9 | Code linting |
| eslint-config-next | 15.5.6 | Next.js ESLint rules |
| drizzle-kit | ^0.31.5 | Database migrations and studio |

## External Services

### Required Services

| Service | Purpose | Environment Variable |
|---------|---------|---------------------|
| OpenAI | AI summarization and tagging | `OPENAI_API_KEY` |

### Optional Services (Production)

| Service | Purpose | Environment Variables |
|---------|---------|----------------------|
| Turso | Edge-compatible SQLite database | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |
| Inngest Cloud | Production job orchestration | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |

## Package Scripts

### Development

```bash
yarn dev          # Start Next.js development server
yarn dev:full     # Start Next.js + Inngest together
yarn inngest:dev  # Start Inngest dev server only
```

### Build

```bash
yarn build        # Build production bundle
yarn start        # Start production server
yarn lint         # Run ESLint
```

### Database

```bash
yarn db:generate  # Generate new migration
yarn db:migrate   # Apply pending migrations
yarn db:studio    # Open Drizzle Studio GUI
```

### Testing

```bash
yarn test:inngest # Test Inngest configuration
```

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `inngest.config.js` | Inngest client configuration |
| `eslint.config.mjs` | ESLint configuration |

## Environment Variables

### Local Development

Create a `.env.local` file:

```bash
# Database (SQLite for local development)
DATABASE_URL=file:./local.db

# OpenAI API Key (required for AI processing)
OPENAI_API_KEY=your-openai-api-key

# Inngest (optional for local development)
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
```

### Production

```bash
# Database (Turso)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token

# OpenAI
OPENAI_API_KEY=your-production-api-key

# Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

## Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Next.js App | http://localhost:3000 | Main application |
| Inngest Dev Server | http://localhost:8288 | Job monitoring |
| Drizzle Studio | http://localhost:4983 | Database GUI |

## Dependency Graph

```
Content Feeder
├── Frontend
│   ├── next.js
│   ├── react
│   ├── react-dom
│   └── styled-components
├── Backend
│   ├── drizzle-orm
│   ├── better-sqlite3
│   └── @libsql/client
├── Jobs
│   └── inngest
├── AI
│   └── openai
├── Parsing
│   └── rss-parser
└── Validation
    └── zod
```

## Version Requirements

- **Node.js**: 18+ (required for Next.js 15)
- **Yarn**: 1.x (classic) or 3.x+ (berry)
- **Operating System**: Linux, macOS, Windows (with WSL for best experience)

## Browser Support

The frontend targets modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
