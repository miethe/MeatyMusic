# MeatyMusic AMCS API Types

This directory contains TypeScript type definitions for all MeatyMusic AMCS API contracts.

## Overview

All types are manually generated from backend Pydantic schemas and JSON schemas to ensure type safety across the frontend-backend boundary. These types match the FastAPI backend exactly.

## Structure

```
/types/api/
├── entities.ts    # Core AMCS entities (Song, Style, Lyrics, etc.)
├── workflows.ts   # Workflow execution and orchestration types
├── events.ts      # WebSocket event types for real-time monitoring
├── index.ts       # Central export for all API types
└── README.md      # This file
```

## Type Sources

### Backend Sources (Python)

Types are generated from:

- **Pydantic Schemas**: `services/api/app/schemas/*.py`
  - `song.py` - Song and WorkflowRun schemas
  - `style.py` - Style schemas
  - `lyrics.py` - Lyrics schemas with POV, Tense, HookStrategy enums
  - `persona.py` - Persona schemas with PersonaKind enum
  - `producer_notes.py` - ProducerNotes schemas
  - `blueprint.py` - Blueprint schemas
  - `source.py` - Source schemas with SourceKind enum
  - `composed_prompt.py` - ComposedPrompt schemas
  - `common.py` - Common response types (ErrorResponse, PageInfo, PaginatedResponse)

- **Event System**: `services/api/app/workflows/events.py`
  - EventPublisher structure
  - WebSocket event payloads

### JSON Schema Sources

Types also reference:

- `/schemas/*.schema.json` - Canonical JSON schemas for entities
  - `sds.schema.json` - Complete Song Design Spec
  - `style.schema.json` - Style entity
  - `lyrics.schema.json` - Lyrics entity
  - `persona.schema.json` - Persona entity
  - `producer_notes.schema.json` - ProducerNotes entity
  - `blueprint.schema.json` - Blueprint entity
  - `source.schema.json` - Source entity
  - `composed_prompt.schema.json` - ComposedPrompt entity

## Usage

### Import Specific Types

```typescript
import type { Song, SongCreate, SongUpdate } from '@/types/api';
import { SongStatus, WorkflowNode } from '@/types/api';
```

### Import from Namespace

```typescript
import { Entities, Workflows, Events } from '@/types/api';

type Song = Entities.Song;
type WorkflowRun = Workflows.WorkflowRun;
type WorkflowEvent = Events.WorkflowEvent;
```

### Use with API Client

```typescript
import type { Song, SongCreate, PaginatedResponse } from '@/types/api';

async function createSong(data: SongCreate): Promise<Song> {
  const response = await fetch('/api/v1/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function listSongs(): Promise<PaginatedResponse<Song>> {
  const response = await fetch('/api/v1/songs');
  return response.json();
}
```

### Use with React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import type { Song, PaginatedResponse } from '@/types/api';

function useSongs() {
  return useQuery<PaginatedResponse<Song>>({
    queryKey: ['songs'],
    queryFn: () => fetch('/api/v1/songs').then(r => r.json()),
  });
}
```

### Use with Zustand Store

```typescript
import { create } from 'zustand';
import type { Song, WorkflowRun, WorkflowRunStatus } from '@/types/api';

interface SongStore {
  currentSong: Song | null;
  workflowRun: WorkflowRun | null;
  setCurrentSong: (song: Song) => void;
  updateWorkflowStatus: (status: WorkflowRunStatus) => void;
}

export const useSongStore = create<SongStore>((set) => ({
  currentSong: null,
  workflowRun: null,
  setCurrentSong: (song) => set({ currentSong: song }),
  updateWorkflowStatus: (status) =>
    set((state) => ({
      workflowRun: state.workflowRun
        ? { ...state.workflowRun, status }
        : null,
    })),
}));
```

### Use with WebSocket Events

```typescript
import type { WorkflowEvent, WorkflowNode, EventHandler } from '@/types/api';
import { WebSocketState } from '@/types/api';

class WorkflowEventStream {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  connect(runId: string) {
    this.ws = new WebSocket(`ws://localhost:8000/events?run_id=${runId}`);

    this.ws.onmessage = (event) => {
      const workflowEvent: WorkflowEvent = JSON.parse(event.data);
      this.notifyHandlers(workflowEvent);
    };
  }

  onNodeCompleted(handler: EventHandler) {
    this.addHandler('node:end', handler);
  }

  private notifyHandlers(event: WorkflowEvent) {
    const key = `${event.node_name || 'run'}:${event.phase}`;
    this.handlers.get(key)?.forEach(handler => handler(event));
  }
}
```

## Type Conventions

### Naming Patterns

- **Base types**: `EntityBase` (e.g., `SongBase`, `StyleBase`)
  - Contains core fields without database metadata

- **Create types**: `EntityCreate` (e.g., `SongCreate`, `StyleCreate`)
  - For POST requests to create new entities
  - Extends `EntityBase`

- **Update types**: `EntityUpdate` (e.g., `SongUpdate`, `StyleUpdate`)
  - For PUT/PATCH requests to update entities
  - All fields optional

- **Response types**: `Entity` (e.g., `Song`, `Style`)
  - For GET responses
  - Includes database fields: `id`, `tenant_id`, `owner_id`, `created_at`, `updated_at`, `deleted_at`

### Enum Naming

All enums use PascalCase with values in lowercase/kebab-case to match backend:

```typescript
export enum SongStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  // ...
}
```

### Common Fields

All response types include:

- `id: UUID` - Entity primary key
- `tenant_id: UUID` - Multi-tenancy support
- `owner_id: UUID` - Entity owner
- `created_at: ISODateTime` - Creation timestamp
- `updated_at: ISODateTime` - Last update timestamp
- `deleted_at?: ISODateTime` - Soft deletion timestamp (optional)

## Validation

Types include JSDoc comments with validation constraints from backend:

```typescript
/**
 * Style base fields
 * Backend: app/schemas/style.py - StyleBase
 */
export interface StyleBase {
  /** Display name for this style */
  name: string;
  /** Primary genre */
  genre: string;
  /** Energy level (1-10) */
  energy_level?: number;
  /** Instrumentation (max 3 items to avoid mix dilution) */
  instrumentation?: string[];
}
```

## Maintenance

### When to Update Types

Update these types when:

1. Backend Pydantic schemas change (`services/api/app/schemas/*.py`)
2. JSON schemas are updated (`/schemas/*.schema.json`)
3. New API endpoints are added
4. Event payloads change (`services/api/app/workflows/events.py`)

### Update Process

1. **Identify Changes**: Check backend schema files for changes
2. **Update Type Files**: Manually update corresponding TypeScript types
3. **Update Tests**: Update any type-dependent tests
4. **Run Type Check**: `npm run type-check` in web app
5. **Document Changes**: Update this README if structure changes

### Type Generation Tools (Future)

Consider adding automated type generation:

- **Option 1**: OpenAPI TypeScript generator
  - Generate OpenAPI spec from FastAPI backend
  - Use `openapi-typescript` to generate types

- **Option 2**: Pydantic to TypeScript
  - Use `pydantic-to-typescript` library
  - Automate schema conversion

- **Option 3**: JSON Schema to TypeScript
  - Use `json-schema-to-typescript`
  - Generate from canonical JSON schemas

## Related Documentation

- **Backend Schemas**: `/services/api/app/schemas/README.md`
- **JSON Schemas**: `/schemas/README.md`
- **API Endpoints**: `/docs/project_plans/PRDs/website_app.prd.md`
- **AMCS Overview**: `/docs/amcs-overview.md`
- **Claude Code Orchestration**: `/docs/project_plans/PRDs/claude_code_orchestration.prd.md`
