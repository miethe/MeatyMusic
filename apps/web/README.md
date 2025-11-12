# MeatyMusic Web Application

Next.js 14 web application for the MeatyMusic AMCS (Agentic Music Creation System).

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4
- **UI Components**: @meatymusic/ui (Radix UI)
- **State Management**:
  - React Query for server state
  - Zustand for client state
- **Authentication**: Clerk
- **Telemetry**: OpenTelemetry API
- **Testing**:
  - Jest for unit tests
  - Playwright for E2E tests

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# From repository root
pnpm install
```

### Development

```bash
# Start development server
cd apps/web
pnpm dev
```

The application will be available at http://localhost:3000

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Key variables:
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `CLERK_SECRET_KEY`: Clerk secret key

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── config/           # Configuration files
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core utilities
│   │   ├── api/          # API client & endpoints
│   │   ├── auth/         # Authentication utilities
│   │   ├── errors/       # Error handling
│   │   └── telemetry/    # OpenTelemetry tracking
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── middleware.ts     # Next.js middleware
├── public/               # Static assets
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Architecture

### API Client

The application uses axios with React Query for data fetching:
- Configured in `src/lib/api/client.ts`
- Automatic Clerk token injection
- Request/response interceptors for telemetry
- Error normalization

### Authentication

Authentication is handled by Clerk:
- Protected routes defined in `src/middleware.ts`
- Auth state accessible via `useAuth()` hook
- Development bypass available for testing

### Telemetry

OpenTelemetry is used for observability:
- Page view tracking
- API call tracking
- Error tracking
- Performance monitoring

### State Management

- **Server State**: React Query (queries, mutations, cache)
- **Client State**: Zustand stores in `src/store/`
- **Form State**: React Hook Form

## Development Guidelines

### Code Style

- ESLint configured with Next.js and TypeScript rules
- Import order enforced
- Strict TypeScript mode enabled

### Component Organization

- Use `'use client'` directive only when needed
- Prefer server components by default
- Co-locate component-specific utilities

### API Integration

- Define endpoints in `src/config/api.ts`
- Use React Query hooks for data fetching
- Handle errors with `ApplicationError`

### Performance

- Use Next.js Image for optimized images
- Implement code splitting with dynamic imports
- Monitor performance budgets (see `src/lib/telemetry/performance.ts`)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript compiler
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm analyze` - Analyze bundle size

## Related Packages

- `@meatymusic/ui` - Shared UI components
- `@meatymusic/tokens` - Design tokens
- `@meatymusic/api` - API client library
- `@meatymusic/store` - Shared Zustand stores

## License

Private - MeatyMusic AMCS
