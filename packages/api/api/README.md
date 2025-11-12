# @meaty/api

Centralized typed API client for MeatyPrompts applications with authentication, error handling, retry logic, and request/response interception.

## Features

- 🔐 **Clerk Authentication**: Seamless integration with Clerk auth tokens
- 🔄 **Automatic Retry**: Exponential backoff for transient failures (429, 503, 5xx)
- 🎯 **TypeScript First**: Fully typed requests and responses
- 📊 **Request Correlation**: Automatic correlation ID tracking for debugging
- ⚡ **Lightweight**: Uses native fetch API (no axios dependency)
- 🛡️ **Advanced Error Handling**: Standardized error envelopes, user-friendly messages, and automatic recovery
- 🔧 **Interceptors**: Extensible request/response middleware
- 📁 **File Uploads**: Built-in multipart/form-data support
- ⏰ **Timeout Control**: Configurable timeouts with AbortController
- 🎛️ **Customizable**: Extensive configuration options

## Installation

This package is part of the MeatyPrompts monorepo and uses workspace dependencies:

```bash
# Install all workspace dependencies
pnpm install
```

## Quick Start

### Basic Usage

```typescript
import { createApiClient } from '@meaty/api';

const client = createApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000
});

// Make requests
const data = await client.get('/api/v1/users');
const created = await client.post('/api/v1/users', { name: 'John' });
```

### With Clerk Authentication (React)

```typescript
import { useApiClient, useCatalogService } from '@meaty/api';

function MyComponent() {
  const catalogService = useCatalogService();

  const fetchModels = async () => {
    try {
      const models = await catalogService.getModels({ effective: true });
      console.log(models);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  return <button onClick={fetchModels}>Load Models</button>;
}
```

### Server-Side Usage

```typescript
import { createApiClient, createCatalogService } from '@meaty/api';

const client = createApiClient({
  baseUrl: process.env.API_URL,
  getAuthToken: async () => process.env.SERVICE_TOKEN
});

const catalogService = createCatalogService(client);
const models = await catalogService.getModels();
```

## API Reference

### ApiClient

#### Methods

- `get<T>(path, options?)` - GET request
- `post<T>(path, body?, options?)` - POST request
- `put<T>(path, body?, options?)` - PUT request
- `patch<T>(path, body?, options?)` - PATCH request
- `delete<T>(path, options?)` - DELETE request
- `upload<T>(path, files, additionalData?, options?)` - File upload

#### Configuration Options

```typescript
interface ApiConfig {
  baseUrl?: string;           // API base URL
  timeout?: number;           // Request timeout (ms)
  defaultHeaders?: object;    // Default headers
  enableRetry?: boolean;      // Enable auto-retry
  maxRetries?: number;        // Max retry attempts
  enableCorrelation?: boolean; // Enable correlation IDs
  getAuthToken?: () => Promise<string | null>; // Auth token provider
  errorConfig?: {               // Error handling configuration
    trackAnalytics?: (event: string, properties: any) => void;
    showNotification?: (message: string, type: string) => void;
    refreshAuthToken?: () => Promise<string | null>;
    maxAuthRetries?: number;
    circuitBreakerThreshold?: number;
    enableConsoleLogging?: boolean;
  };
}
```

#### Request Options

```typescript
interface RequestOptions {
  headers?: object;           // Additional headers
  query?: object;             // Query parameters
  timeout?: number;           // Override timeout
  disableRetry?: boolean;     // Disable retry for this request
  correlationId?: string;     // Custom correlation ID
  signal?: AbortSignal;       // Cancellation signal
}
```

### Services

#### CatalogService

```typescript
const catalogService = createCatalogService(client);

// Get models
const models = await catalogService.getModels();
const model = await catalogService.getModel('model-id');

// Manage models
const created = await catalogService.createModel({
  name: 'new-model',
  display_name: 'New Model',
  provider: 'openai'
});

const updated = await catalogService.updateModel('model-id', {
  display_name: 'Updated Name'
});

await catalogService.deleteModel('model-id');
```

#### UserPreferencesService

```typescript
const userService = createUserPreferencesService(client);

// Get user preferences
const prefs = await userService.getUserPreferences();
console.log('Current theme:', prefs.theme);

// Update general preferences
const updated = await userService.updateUserPreferences({
  theme: 'dark',
  communication_opt_in: true,
  notifications: {
    email_updates: false,
    prompt_shares: true
  }
});

// Onboarding tour management
await userService.updateOnboardingPreferences({
  tour_completed: true,
  tour_step: 5,
  completed_at: new Date().toISOString()
});

// Reset onboarding tour to start over
await userService.resetOnboardingTour();

// Convenience methods for common updates
await userService.updateTheme('ocean');
await userService.updateNotificationPreferences({
  email_updates: true,
  system_announcements: false
});
await userService.toggleCommunicationOptIn(false);
```

**User Preferences Data Structure:**
```typescript
interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  onboarding: OnboardingPreferences;
  communication_opt_in: boolean;
  notifications: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

interface OnboardingPreferences {
  tour_completed: boolean;
  tour_step: number;
  tour_dismissed: boolean;
  completed_at?: string;
}

interface NotificationPreferences {
  email_updates: boolean;
  prompt_shares: boolean;
  collection_invites: boolean;
  system_announcements: boolean;
  [key: string]: boolean;
}
```

#### PromptsService

```typescript
const promptsService = createPromptsService(client);

// List and search
const prompts = await promptsService.getPrompts({
  page: 1,
  limit: 20,
  search: 'code review'
});

// CRUD operations
const prompt = await promptsService.createPrompt({
  title: 'Code Review Helper',
  content: 'Review this code: {{code}}',
  tags: ['review', 'code']
});

const updated = await promptsService.updatePrompt('prompt-id', {
  title: 'Updated Title'
});

// Run prompts
const result = await promptsService.runPrompt('prompt-id', {
  variables: { code: 'console.log("hello");' },
  model_id: 'gpt-4'
});

// Clone and share
const cloned = await promptsService.clonePrompt('prompt-id', 'Cloned Title');
const shareInfo = await promptsService.sharePrompt('prompt-id');
```

### Error Handling

The API client provides comprehensive error handling with standardized error envelopes, user-friendly messages, and automatic recovery mechanisms.

#### Basic Error Handling

```typescript
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ERROR_CODES,
  mapErrorToUserMessage
} from '@meaty/api';

try {
  await client.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('API Error:', error.status, error.code);
    console.log('Correlation ID:', error.correlationId);

    // Get user-friendly message
    const userMessage = mapErrorToUserMessage(error.code);
    console.log('User message:', userMessage.userMessage);
    console.log('Recovery action:', userMessage.action);
  }
}
```

#### Advanced Error Configuration

```typescript
import { createApiClient } from '@meaty/api';
import { toast } from 'sonner';
import { analytics } from './analytics';

const client = createApiClient({
  baseUrl: 'https://api.example.com',
  errorConfig: {
    // Track all errors for observability
    trackAnalytics: (event, properties) => {
      analytics.track(event, properties);
    },

    // Show toast notifications for certain errors
    showNotification: (message, type) => {
      toast[type](message);
    },

    // Automatically refresh auth tokens on 401
    refreshAuthToken: async () => {
      return await auth.refreshToken();
    },

    // Circuit breaker settings
    circuitBreakerThreshold: 5,
    maxAuthRetries: 1,
    enableConsoleLogging: true
  }
});
```

#### React Error Handling Hook

```typescript
import { useApiError } from '@/hooks/useApiError';

function MyComponent() {
  const { handleError } = useApiError();

  const submitData = async (formData) => {
    try {
      await api.createResource(formData);
      toast.success('Resource created successfully');
    } catch (error) {
      // Automatically handles:
      // - Toast notifications with user-friendly messages
      // - Analytics tracking with context
      // - Recovery actions (redirect to login, retry, etc.)
      // - Error sanitization for logging
      handleError(error, {
        operation: 'create_resource',
        resourceType: formData.type
      });
    }
  };

  return <form onSubmit={submitData}>...</form>;
}
```

#### Error Response Format

All errors use a standardized envelope:

```typescript
interface ErrorResponse {
  code: string;           // Domain-specific code (AUTH_TOKEN_EXPIRED)
  message: string;        // Technical message for logging
  details?: {             // Additional context
    field?: string;       // Field name for validation errors
    suggestion?: string;  // Recovery suggestion
    context?: object;     // Extra context data
  };
  timestamp: string;      // ISO timestamp
  traceId: string;       // Correlation ID for debugging
  status?: number;       // HTTP status code
}
```

#### Common Error Codes

```typescript
// Authentication
AUTH_TOKEN_EXPIRED       // Session expired → redirect to login
AUTH_PERMISSION_DENIED   // Insufficient permissions → contact support

// Network
NETWORK_CONNECTION_FAILED // No connectivity → retry
NETWORK_TIMEOUT          // Request timeout → retry
NETWORK_CORS_ERROR       // CORS blocked → refresh page

// Validation
VALIDATION_REQUIRED_FIELD // Missing field → show field error
VALIDATION_INVALID_FORMAT // Invalid format → show format help

// Server
SERVER_INTERNAL_ERROR    // 500 error → retry with backoff
SERVER_UNAVAILABLE       // 503 error → retry later
```

For complete error handling documentation, see [Error Handling Guide](./docs/error-handling.md).

### File Uploads

```typescript
// Single file
const file = new File(['content'], 'document.txt');
const result = await client.upload('/api/upload', [file]);

// Multiple files with metadata
const files = [file1, file2];
const result = await client.upload('/api/upload', files, {
  category: 'documents',
  description: 'Important files'
});
```

### Request Cancellation

```typescript
const controller = new AbortController();

// Start request
const promise = client.get('/api/data', {
  signal: controller.signal
});

// Cancel if needed
setTimeout(() => controller.abort(), 5000);

try {
  const data = await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

## Migration Guide

### From Direct Axios Usage

**Before:**
```typescript
import axios from 'axios';

const response = await axios.get(`${API_BASE_URL}/api/v1/users`, {
  headers: { Authorization: `Bearer ${token}` }
});
return response.data;
```

**After:**
```typescript
import { createApiClient } from '@meaty/api';

const client = createApiClient({
  getAuthToken: async () => token
});
const data = await client.get('/api/v1/users');
return data;
```

### From Legacy apiRequest

**Before:**
```typescript
import { apiRequest } from './api_client';

const data = await apiRequest({
  endpoint: '/api/v1/users',
  method: 'GET',
  token
});
```

**After:**
```typescript
import { createApiClient } from '@meaty/api';

const client = createApiClient({
  getAuthToken: async () => token
});
const data = await client.get('/api/v1/users');
```

### React Hooks Migration

**Before (Direct Axios):**
```typescript
// apps/web/src/lib/api/userPreferences.ts
import axios from 'axios';

export const userPreferencesApi = {
  async getUserPreferences(token: string): Promise<UserPreferences> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
};

// Usage in React hooks
import { userPreferencesApi } from '../lib/api/userPreferences';

const updatePrefs = async () => {
  const token = await getToken();
  return userPreferencesApi.updateUserPreferences(token, prefs);
};
```

**After (Typed API Client):**
```typescript
// apps/web/src/lib/api/userPreferences.ts
import {
  createApiClient,
  createUserPreferencesService,
  UserPreferences,
  UserPreferencesUpdate
} from '@meaty/api';

export const userPreferencesApi = {
  async getUserPreferences(token: string): Promise<UserPreferences> {
    const client = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      getAuthToken: async () => token
    });
    const service = createUserPreferencesService(client);
    return service.getUserPreferences();
  }
};

// Usage with service hooks (alternative approach)
import { useUserPreferencesService } from '@meaty/api';

function MyComponent() {
  const userService = useUserPreferencesService();

  const updatePrefs = () => userService.updateUserPreferences(prefs);
}
```

## Best Practices

### 1. Use Service Classes

Always use the provided service classes instead of making raw HTTP calls:

```typescript
// ✅ Good
const catalogService = createCatalogService(client);
const models = await catalogService.getModels();

// ❌ Avoid
const models = await client.get('/api/v1/catalog/models');
```

### 2. Handle Errors Properly

Use typed error handling for better user experience:

```typescript
try {
  const data = await service.getData();
} catch (error) {
  if (error instanceof ApiError && error.status === 404) {
    showNotFound();
  } else if (error instanceof NetworkError) {
    showOfflineMessage();
  } else {
    showGenericError();
  }
}
```

### 3. Use React Query for Caching

Combine with React Query for optimal data fetching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useCatalogService } from '@meaty/api';

function useModels() {
  const catalogService = useCatalogService();

  return useQuery({
    queryKey: ['catalog', 'models'],
    queryFn: () => catalogService.getModels({ effective: true }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

### 4. Implement Loading States

Handle loading and error states in your UI:

```typescript
function ModelsList() {
  const { data: models, error, isLoading } = useModels();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!models?.length) return <EmptyState />;

  return <ModelCards models={models} />;
}
```

## Troubleshooting

- **401 Unauthorized** – ensure `getAuthToken` returns a valid Clerk token.
- **NetworkError** – verify the API base URL and network connectivity.
- **TimeoutError** – increase the `timeout` value for long‑running requests.
- **Invalid JSON** – confirm the server returns valid JSON with the correct headers.
- **TypeScript errors** – run `pnpm typecheck` to surface type mismatches.

Additional migration examples are available in the [web refactor guide](../../docs/migration/web-refactor.md).

## Development

### Running Tests

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Building

```bash
# Build package
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Architecture

The package follows a layered architecture:

```
┌─────────────────┐
│   Services      │ ← High-level typed service classes
├─────────────────┤
│   ApiClient     │ ← HTTP client with interceptors
├─────────────────┤
│   Interceptors  │ ← Request/response middleware
├─────────────────┤
│   Utilities     │ ← Retry, correlation, query utils
├─────────────────┤
│   Types/Errors  │ ← TypeScript definitions
└─────────────────┘
```

## Contributing

1. Follow existing TypeScript patterns
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow conventional commit messages

## License

Private - Part of MeatyPrompts monorepo
