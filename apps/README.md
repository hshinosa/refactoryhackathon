# Codebase Wiki - Monorepo Structure

## Overview

Monorepo Next.js dengan workspace separation antara frontend (`apps/web`) dan service layer (`apps/api`). Struktur ini mengikuti PRD, ADR, C4, dan OpenSpec change aktif `build-codebase-wiki-backend-mvp`.

## Structure

```
hackathon/
├── package.json                 # Root workspace config
├── .env.example                 # Environment variables template
├── apps/
│   ├── web/                     # Next.js 14 app (frontend + thin route handlers)
│   │   ├── app/
│   │   │   ├── api/             # Thin route handlers / controllers only
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Home page
│   │   │   └── globals.css      # Global styles
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── tailwind.config.ts
│   └── api/                     # Service layer (business logic)
│       ├── services/
│       │   ├── auth/
│       │   ├── project-intake/
│       │   ├── source-ingestion/
│       │   ├── codebase-analysis/
│       │   │   ├── folder-scanner/
│       │   │   ├── dependency-scanner/
│       │   │   ├── tech-stack-detector/
│       │   │   ├── exclude-filter/
│       │   │   └── context-builder/
│       │   ├── ai-doc-generation/
│       │   ├── storage/
│       │   ├── semantic-search/
│       │   └── regenerate/
│       ├── utils/
│       ├── types/
│       │   └── index.ts         # Shared TypeScript types
│       ├── config.ts             # Backend configuration
│       ├── index.ts              # Package exports
│       ├── package.json
│       └── tsconfig.json
├── docs/                         # Documentation
├── openspec/                     # OpenSpec change tracking
└── workflows/                    # Agent pipelines

```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `OPENAI_API_KEY` - Your OpenAI API key
- `ENCRYPTION_SECRET_KEY` - 32-character secret for PAT encryption
- `NEXTAUTH_SECRET` - NextAuth secret

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Frontend (`apps/web`)

- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **NextAuth** for authentication
- **Thin route handlers** that call `@codebase-wiki/api` services
- UI is not the current primary implementation focus; backend contracts drive integration

### Service Layer (`apps/api`)

- **Business logic** separated from Next.js runtime
- **Testable** services without Next.js dependencies
- **Reusable** across different frontends if needed

### Current backend-first focus

The active OpenSpec change is:

```text
build-codebase-wiki-backend-mvp
```

Current implementation priority:

- auth/session with NextAuth/Auth.js
- create project flow
- ZIP upload or GitHub URL + PAT intake
- temporary source storage in `/tmp` with cleanup TTL
- codebase analysis with exclude filtering and compact context building
- OpenAI-compatible AI documentation generation
- multi-page Markdown docs + generated sidebar + docs history
- semantic search preparation with embeddings/vector index
- regenerate endpoint for GitHub Actions workflows

### Codebase analysis strategy

The backend uses a hybrid codebase analysis approach:

- **folder-scanner** for structure and important file discovery
- **dependency-scanner** for dependency manifests
- **tech-stack-detector** for framework/library identification
- **exclude-filter** for skipping non-essential folders/artifacts
- **context-builder** for compact AI-ready context

This keeps analysis deterministic first, then uses AI on top of summarized context rather than raw full source.

### Storage model

- **Temporary Source Storage**: ephemeral working area for uploaded ZIPs and cloned repositories
- **Documentation Store**: current docs, metadata, and generation status
- **Docs History**: retained history of generated docs
- **Encrypted PAT Store**: per-user PAT storage for private repo clone and regenerate docs
- **Vector Index Store**: semantic search preparation for future AI chat

### Import Pattern

```typescript
import { config, CodebaseAnalysis } from '@codebase-wiki/api';
import { analyzeCodebase } from '@codebase-wiki/api/services/codebase-analysis';
```

## Development Workflow

### Adding a new service

1. Create service directory in `apps/api/services/{service-name}/`
2. Implement service logic
3. Export from `apps/api/index.ts` if needed
4. Create API route in `apps/web/app/api/{route}/route.ts`
5. Call service from API route

Rules:

- Keep route handlers thin.
- Business logic belongs in `apps/api`.
- OpenSpec tasks remain the source of truth for implementation order and progress.
- Keep ADR and C4 aligned with structural changes.

### Example: API Route → Service

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeCodebase } from '@codebase-wiki/api/services/codebase-analysis';

export async function POST(req: NextRequest) {
  const { projectId, tempStoragePath } = await req.json();
  
  const analysis = await analyzeCodebase(projectId, tempStoragePath);
  
  return NextResponse.json(analysis);
}
```

## Scripts

- `npm run dev` - Start development server (apps/web)
- `npm run build` - Build all workspaces
- `npm run start` - Start production server (apps/web)
- `npm run lint` - Lint all workspaces
- `npm run test` - Run tests in all workspaces

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS 3
- NextAuth 4

### Backend
- Node.js 18+
- TypeScript 5
- OpenAI SDK
- simple-git (GitHub clone)
- adm-zip (ZIP extraction)

## Environment Variables

See `.env.example` for all available environment variables.

### Required
- `OPENAI_API_KEY` - OpenAI API key for AI doc generation
- `ENCRYPTION_SECRET_KEY` - Secret key for PAT encryption (32 chars)
- `NEXTAUTH_SECRET` - NextAuth secret for session encryption

### Optional
- `AI_MODEL` - AI model for doc generation (default: gpt-4-turbo-preview)
- `AI_EMBEDDING_MODEL` - Embedding model (default: text-embedding-3-small)
- `MAX_ZIP_SIZE` - Max ZIP upload size in bytes (default: 52428800 = 50MB)
- `TEMP_STORAGE_PATH` - Temporary storage path (default: /tmp/codebase-wiki)
- `CLEANUP_TTL` - Cleanup TTL in ms (default: 1800000 = 30 min)

## Next Steps

1. Implement auth/session service (Task 2.1-2.3)
2. Implement project intake service (Task 3.1-3.2)
3. Implement source ingestion service (Task 4.1-4.4)
4. Implement codebase analysis service (Task 5.1-5.4)
5. Implement AI doc generation service (Task 6.1-6.5)
6. Implement storage and retrieval service (Task 7.1-7.3)
7. Implement semantic search preparation (Task 8.1-8.3)
8. Implement regenerate endpoint (Task 9.1-9.3)

See `openspec/changes/build-codebase-wiki-backend-mvp/tasks.md` for the detailed backend-first task plan.

See `openspec/changes/build-codebase-wiki-backend-mvp/tasks.md` for full task list.
