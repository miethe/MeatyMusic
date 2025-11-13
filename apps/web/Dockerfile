# MeatyMusic Web Application Dockerfile
# Multi-stage build for Next.js application

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig.base.json ./packages/

# Copy package.json files for all workspace packages
COPY packages/ui/package.json ./packages/ui/
COPY packages/tokens/package.json ./packages/tokens/
COPY packages/store/package.json ./packages/store/
COPY packages/api/package.json ./packages/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY packages ./packages
COPY apps/web ./apps/web
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build workspace packages first (ui, tokens, etc.)
# Must build in order due to dependencies: tokens -> ui, store, api
# Use TSC with skipLibCheck for production builds to avoid strict type errors
ENV TSC_COMPILE_ON_ERROR=true
RUN pnpm --filter "@meatymusic/tokens" build && \
    pnpm --filter "@meatymusic/ui" exec tsc -p tsconfig.build.json --skipLibCheck && \
    pnpm --filter "@meatymusic/ui" exec copyfiles -u 1 "src/**/*.module.css" dist && \
    pnpm --filter "@meatymusic/store" build && \
    pnpm --filter "@meatymusic/api" build

# Build the Next.js application
WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/web/server.js"]
