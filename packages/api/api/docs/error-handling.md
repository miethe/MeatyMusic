# Error Handling Guide

This document describes the standardized error handling system in the `@meaty/api` package, which provides consistent error management across the MeatyPrompts application.

## Overview

The error handling system consists of:

- **ErrorResponse envelope**: Standardized error format
- **Error codes**: Domain-based error classification system
- **Error interceptor**: Automatic error transformation and handling
- **Error mapper**: User-friendly message generation
- **React hooks**: Frontend error handling utilities

## Quick Start

### Basic Usage

```typescript
import { createApiClient, ERROR_CODES } from '@meaty/api';

const client = createApiClient({
  baseUrl: 'https://api.example.com',
  errorConfig: {
    trackAnalytics: (event, properties) => {
      // Track error events
      analytics.track(event, properties);
    },
    showNotification: (message, type) => {
      // Show toast notifications
      toast[type](message);
    },
    refreshAuthToken: async () => {
      // Refresh auth token on 401 errors
      return await auth.refreshToken();
    }
  }
});

try {
  const data = await client.get('/api/prompts');
} catch (error) {
  // Error is automatically transformed to standardized format
  console.log('Error code:', error.code);
  console.log('User message:', error.message);
  console.log('Trace ID:', error.correlationId);
}
```

### React Hook Usage

```tsx
import { useApiError } from '@/hooks/useApiError';

function MyComponent() {
  const { handleError } = useApiError();

  const handleSubmit = async (data) => {
    try {
      await api.createPrompt(data);
    } catch (error) {
      // Automatically shows toast, tracks analytics, handles recovery
      handleError(error, { action: 'create_prompt', promptType: 'chat' });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Error Response Format

All errors follow the standardized `ErrorResponse` envelope:

```typescript
interface ErrorResponse {
  /** Domain-specific error code (e.g., AUTH_TOKEN_EXPIRED) */
  code: string;
  /** Human-readable error message for logging/debugging */
  message: string;
  /** Additional error context and details */
  details?: {
    field?: string;        // Field name for validation errors
    value?: any;           // Invalid value for validation errors
    suggestion?: string;   // Recovery suggestion
    context?: Record<string, any>; // Additional context
  };
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** Correlation ID for request tracing */
  traceId: string;
  /** HTTP status code */
  status?: number;
}
```

### Example Error Responses

```typescript
// Authentication error
{
  code: 'AUTH_TOKEN_EXPIRED',
  message: 'JWT token has expired',
  timestamp: '2025-01-21T10:30:00Z',
  traceId: 'abc123-def456-ghi789',
  status: 401
}

// Validation error with field details
{
  code: 'VALIDATION_REQUIRED_FIELD',
  message: 'Required field is missing',
  details: {
    field: 'email',
    suggestion: 'Please provide a valid email address'
  },
  timestamp: '2025-01-21T10:30:00Z',
  traceId: 'abc123-def456-ghi789',
  status: 400
}

// Network error
{
  code: 'NETWORK_CONNECTION_FAILED',
  message: 'Failed to connect to server',
  timestamp: '2025-01-21T10:30:00Z',
  traceId: 'abc123-def456-ghi789'
}
```

## Error Codes

Error codes follow the pattern: `DOMAIN_ACTION_ERROR`

### Categories

- **AUTH_**: Authentication and authorization
- **CATALOG_**: Model catalog operations
- **PROMPT_**: Prompt management
- **USER_**: User and preferences
- **NETWORK_**: Network connectivity
- **RATE_LIMIT_**: Rate limiting and quotas
- **SERVER_**: Server and infrastructure
- **VALIDATION_**: Input validation
- **FILE_**: File operations

### Common Error Codes

```typescript
// Authentication
AUTH_TOKEN_EXPIRED       // Session expired, redirect to login
AUTH_PERMISSION_DENIED   // Insufficient permissions
AUTH_TOKEN_INVALID       // Invalid or malformed token

// Network
NETWORK_CONNECTION_FAILED // No network connectivity
NETWORK_TIMEOUT          // Request exceeded timeout
NETWORK_CORS_ERROR       // CORS policy blocked request

// Server
SERVER_INTERNAL_ERROR    // Generic 5xx error
SERVER_UNAVAILABLE       // Service temporarily down
SERVER_TIMEOUT          // Gateway timeout

// Validation
VALIDATION_REQUIRED_FIELD // Missing required field
VALIDATION_INVALID_FORMAT // Invalid input format
VALIDATION_OUT_OF_RANGE  // Value outside allowed range
```

## Error Interceptor

The error interceptor automatically:

- Transforms all errors to standard format
- Maps HTTP status codes to semantic error codes
- Attempts auth token refresh on 401 errors
- Implements circuit breaker pattern
- Tracks analytics events
- Shows user notifications
- Sanitizes sensitive data from logs

### Configuration

```typescript
const client = createApiClient({
  errorConfig: {
    // Required: Function to refresh auth tokens
    refreshAuthToken: async () => {
      return await authProvider.refreshToken();
    },

    // Optional: Analytics tracking
    trackAnalytics: (event: string, properties: Record<string, any>) => {
      analytics.track(event, properties);
    },

    // Optional: User notifications
    showNotification: (message: string, type: 'error' | 'warning' | 'info') => {
      toast[type](message);
    },

    // Optional: Auth retry configuration
    maxAuthRetries: 1,

    // Optional: Circuit breaker settings
    circuitBreakerThreshold: 5,    // Failures before opening circuit
    circuitBreakerResetTime: 60000, // Time before retrying (ms)

    // Optional: Logging
    enableConsoleLogging: true
  }
});
```

### Circuit Breaker

Prevents retry flooding by temporarily blocking requests after repeated failures:

- **Closed**: Normal operation
- **Open**: Blocking requests after threshold failures
- **Half-open**: Testing if service has recovered

## Error Mapping

Maps error codes to user-friendly messages with recovery actions:

```typescript
import { mapErrorToUserMessage, mapErrorResponseToUserMessage } from '@meaty/api';

// Map error code to user message
const userMessage = mapErrorToUserMessage('AUTH_TOKEN_EXPIRED');
console.log(userMessage);
// {
//   userMessage: 'Your session has expired',
//   description: 'Please sign in again to continue',
//   action: 'redirect_login',
//   actionLabel: 'Sign In',
//   severity: 'warning'
// }

// Map full ErrorResponse
const errorResponse = { code: 'NETWORK_TIMEOUT', message: '...', ... };
const mappedMessage = mapErrorResponseToUserMessage(errorResponse);
```

### Recovery Actions

- **retry**: Retry the operation immediately
- **retry_with_backoff**: Retry after exponential backoff
- **redirect_login**: Redirect to login page
- **refresh_page**: Reload the current page
- **go_back**: Navigate to previous page
- **contact_support**: Navigate to support page
- **dismiss**: No automatic action

### Severity Levels

- **critical**: System-wide failures
- **error**: Operation failures
- **warning**: Recoverable issues
- **info**: Informational messages

## React Hooks

### useApiError

Primary hook for handling API errors in React components:

```tsx
import { useApiError } from '@/hooks/useApiError';

function MyComponent() {
  const { handleError, showToast } = useApiError();

  const handleApiCall = async () => {
    try {
      await api.someOperation();
    } catch (error) {
      // Handles error transformation, toast display, analytics, and recovery
      handleError(error, {
        operation: 'someOperation',
        userId: user?.id
      });
    }
  };

  return <button onClick={handleApiCall}>Execute</button>;
}
```

### useAsyncError

Utility for wrapping async operations with error handling:

```tsx
import { useAsyncError } from '@/hooks/useApiError';

function MyComponent() {
  const executeWithErrorHandling = useAsyncError();

  const handleClick = async () => {
    const result = await executeWithErrorHandling(
      async () => api.complexOperation(),
      { context: 'user_action' }
    );

    if (result) {
      // Operation succeeded
      console.log('Success:', result);
    }
    // Errors are automatically handled, returns null on failure
  };

  return <button onClick={handleClick}>Execute</button>;
}
```

## Best Practices

### Error Code Design

1. **Use semantic naming**: `PROMPT_CREATE_FAILED` not `ERROR_123`
2. **Follow domain pattern**: `DOMAIN_ACTION_ERROR`
3. **Be specific**: `AUTH_TOKEN_EXPIRED` not `AUTH_ERROR`
4. **Consider user impact**: Map to appropriate severity and actions

### Error Handling

1. **Always provide context**: Include operation details in error handling
2. **Don't expose sensitive data**: Use sanitization for logging
3. **Provide recovery actions**: Guide users on next steps
4. **Track for observability**: Include trace IDs and analytics

### User Experience

1. **Progressive disclosure**: Show simple message, offer details option
2. **Actionable messaging**: Include specific steps for resolution
3. **Consistent tone**: Friendly but informative
4. **Accessibility**: Ensure screen reader compatibility

### Testing

1. **Test all error paths**: Network, auth, validation, server errors
2. **Mock error scenarios**: Use test utilities for consistent errors
3. **Verify user experience**: Test toast messages and recovery actions
4. **Check analytics**: Ensure proper error event tracking

## Migration Guide

### From Direct Axios Usage

Before:
```typescript
try {
  const response = await axios.get('/api/data');
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    router.push('/login');
  }
  toast.error('Something went wrong');
  throw error;
}
```

After:
```typescript
import { useApiError } from '@/hooks/useApiError';

const { handleError } = useApiError();

try {
  const data = await apiClient.get('/api/data');
  return data;
} catch (error) {
  // Automatically handles 401 redirect, shows appropriate toast
  handleError(error, { operation: 'fetch_data' });
  throw error; // Re-throw if component needs to handle
}
```

### From Custom Error Handling

Before:
```typescript
const handleApiError = (error: any) => {
  let message = 'Unknown error';
  if (error.response?.status === 429) {
    message = 'Too many requests';
  } else if (error.response?.status >= 500) {
    message = 'Server error';
  }
  toast.error(message);
};
```

After:
```typescript
import { useApiError } from '@/hooks/useApiError';

// Automatic message mapping, analytics, recovery actions
const { handleError } = useApiError();
```

## Troubleshooting

### Common Issues

**Error: "Circuit breaker is open"**
- Service has failed repeatedly
- Wait for circuit breaker reset time or check service health

**Error: "Auth refresh failed"**
- Check auth token provider implementation
- Verify refresh endpoint is accessible

**Missing error messages**
- Add error code mapping in ErrorMapper.ts
- Use fallback message system

**Sensitive data in logs**
- Check sanitization patterns in ErrorResponse.ts
- Update sanitizeObject function

### Debugging

Enable detailed logging:
```typescript
const client = createApiClient({
  errorConfig: {
    enableConsoleLogging: true
  }
});
```

Check analytics events:
```typescript
const client = createApiClient({
  errorConfig: {
    trackAnalytics: (event, properties) => {
      console.log('Error event:', event, properties);
      // Your analytics implementation
    }
  }
});
```

## API Reference

### Core Functions

- `transformToErrorResponse(error, fallbackCode?, correlationId?)`: Transform any error to standard format
- `mapErrorToUserMessage(code, context?)`: Get user-friendly message for error code
- `mapErrorResponseToUserMessage(error, context?)`: Get user message for full error response
- `createErrorInterceptor(config?)`: Create configured error interceptor
- `sanitizeErrorForLogging(error)`: Remove sensitive data for safe logging

### Utilities

- `isRetryableErrorCode(code)`: Check if error should be retried
- `getErrorSeverity(code)`: Get severity level for error code
- `getRecommendedAction(code)`: Get recommended recovery action
- `createErrorSummary(error)`: Create concise error summary

### Type Guards

- `isErrorResponse(obj)`: Check if object is ErrorResponse
- `isAuthError(code)`: Check if error code is auth-related
- `isNetworkError(code)`: Check if error code is network-related
- `isServerError(code)`: Check if error code is server-related
