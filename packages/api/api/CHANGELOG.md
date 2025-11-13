# Changelog

All notable changes to the @meaty/api package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Prevented `METHOD_BINDING_ERROR` by preserving native `Response` methods in response interceptors.

## [0.0.1] - 2025-01-XX

### Added

#### Core Features
- **ApiClient**: Centralized HTTP client with fetch API
- **Authentication**: Seamless Clerk integration via `useAuth` hook
- **Request/Response Interceptors**: Extensible middleware system
- **Automatic Retry Logic**: Exponential backoff for transient failures (429, 503, 5xx)
- **Correlation Tracking**: Automatic correlation ID generation and propagation
- **Timeout Control**: Configurable timeouts with AbortController support
- **File Uploads**: Built-in multipart/form-data handling

#### Error System
- **ApiError**: HTTP errors with status codes and correlation tracking
- **NetworkError**: Connection and network-related failures
- **TimeoutError**: Request timeout handling
- **ValidationError**: Request/response validation failures

#### Service Modules
- **CatalogService**: Typed catalog model management
  - Get, create, update, delete models
  - Query filtering and pagination support
- **UserPreferencesService**: User preferences and onboarding management
  - Theme, notification, and communication preferences
  - Onboarding tour state management
- **PromptsService**: Comprehensive prompt management
  - CRUD operations with pagination
  - Prompt execution with variable injection
  - Clone, share, and run history features

#### React Integration
- **useApiClient**: Hook for authenticated API client
- **useCatalogService**: Hook for catalog operations
- **useUserPreferencesService**: Hook for user preferences
- **usePromptsService**: Hook for prompt operations

#### Utilities
- **Retry Logic**: Configurable exponential backoff with jitter
- **Query Serialization**: URL parameter handling
- **Correlation IDs**: Request tracking and debugging support

#### Developer Experience
- **Full TypeScript Support**: Comprehensive type definitions
- **Jest Test Suite**: 80%+ test coverage across all modules
- **Migration Guide**: Step-by-step migration from axios/legacy clients
- **Comprehensive Documentation**: Usage examples and best practices

### Technical Details

#### Bundle Size
- **Target**: <10KB gzipped
- **Dependencies**: Minimal (uuid, @clerk/nextjs as peer dependency)
- **Tree-shakeable**: ESM exports for optimal bundling

#### Configuration Options
```typescript
interface ApiConfig {
  baseUrl?: string;           // Default: NEXT_PUBLIC_API_URL
  timeout?: number;           // Default: 30000ms
  enableRetry?: boolean;      // Default: true
  maxRetries?: number;        // Default: 3
  enableCorrelation?: boolean; // Default: true
  getAuthToken?: () => Promise<string | null>;
}
```

#### Default Behaviors
- **Retry Policy**: 3 attempts with 1s, 2s, 4s delays (capped at 8s)
- **Timeout**: 30 seconds for all requests
- **Content-Type**: `application/json` by default
- **Correlation**: Automatic UUIDs with `req_` prefix

### Architecture Decisions

1. **Fetch over Axios**: Reduced bundle size, native browser support
2. **Service Layer Pattern**: Typed business logic separation from HTTP details
3. **Interceptor Chain**: Extensible request/response processing
4. **Correlation-First**: Built-in request tracking for observability
5. **React Hook Integration**: Seamless Clerk authentication handling

### Migration Support

#### Legacy Compatibility
- Maintains same public API shapes where possible
- Provides migration helper functions
- Example migration files for common patterns
- Gradual rollout support with feature flags

#### Breaking Changes from Legacy
- Removes direct axios dependency
- Changes error shapes to include correlation IDs
- Requires React context for authentication hooks
- Updates response type structures for consistency

### Testing

#### Coverage Metrics
- **Base Client**: 95% line coverage
- **Services**: 90% line coverage
- **Utilities**: 100% line coverage
- **Error Handling**: 85% line coverage
- **Overall**: 80%+ line coverage maintained

#### Test Types
- **Unit Tests**: All utilities, services, and client methods
- **Integration Tests**: Full request cycles with MSW mocks
- **Error Scenarios**: Network failures, timeouts, HTTP errors
- **Authentication**: Token handling and refresh flows
