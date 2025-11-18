# Getting Started with MeatyMusic AMCS Development

Welcome to MeatyMusic AMCS development! This guide will help you set up the development environment, understand the project structure, and get ready to contribute.

**Estimated Time**: 30-45 minutes

---

## Prerequisites

Before you start, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Git | Latest | Version control |
| Python | 3.12+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| pnpm | 8+ | Package manager |
| Docker | Latest | Container runtime |
| Docker Compose | 2.0+ | Multi-container orchestration |
| PostgreSQL | 15+ | Database (for direct access) |
| Redis | 7+ | Cache (for direct access) |

### Installation

```bash
# macOS (using Homebrew)
brew install python@3.12 node docker docker-compose postgresql redis

# Install pnpm
npm install -g pnpm

# Ubuntu/Debian
sudo apt-get install python3.12 nodejs docker.io docker-compose postgresql redis-server

# Or use nvm and fnm for version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
curl https://fnm.io/install -fsSL | bash
```

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/MeatyMusic.git
cd MeatyMusic

# Verify you're on the main branch
git branch -vv
```

---

## Step 2: Backend Setup

### 2.1 Create Python Virtual Environment

```bash
cd services/api

# Create virtual environment
python3.12 -m venv .venv

# Activate it
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Verify activation
which python
python --version  # Should be 3.12+
```

### 2.2 Install Python Dependencies

```bash
# Install the project and dependencies
pip install -e .

# Verify installation
pip list | grep -E "fastapi|sqlalchemy|alembic"
```

### 2.3 Configure Backend Environment

```bash
# Copy example to actual config
cp .env.example .env

# Edit .env with your configuration
nano .env
# At minimum, configure:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - CLERK_SECRET_KEY
```

---

## Step 3: Frontend Setup

### 3.1 Install Frontend Dependencies

```bash
# From project root
cd /path/to/MeatyMusic

# Install all dependencies
pnpm install

# This installs:
# - packages/ui components
# - packages/tokens design system
# - packages/api client
# - packages/store state management
# - apps/web application
```

### 3.2 Configure Frontend Environment

```bash
# Set up frontend environment
cd apps/web
cp .env.example .env.local

# Edit .env.local
nano .env.local
# Configure:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - Other API endpoints
```

---

## Step 4: Start Infrastructure Services

### 4.1 Start Docker Services

```bash
# From project root, navigate to infra
cd infra

# Start PostgreSQL, Redis, and observability stack
docker-compose up -d

# Verify services are running
docker-compose ps

# Should show:
# meatymusic-postgres    (healthy)
# meatymusic-redis       (healthy)
# meatymusic-jaeger      (running)
# meatymusic-prometheus  (running)
# meatymusic-grafana     (running)
```

### 4.2 Verify Database Connection

```bash
# Test PostgreSQL connection
psql -h localhost -U meatymusic -d meatymusic_db -c "SELECT version();"

# Should output PostgreSQL version
# Password: (default from docker-compose)
```

### 4.3 Initialize Database (if needed)

```bash
cd services/api

# Check current migrations
alembic current

# Run migrations
alembic upgrade head
```

---

## Step 5: Start Development Servers

### 5.1 Start Backend API

```bash
# From services/api directory
source .venv/bin/activate

# Start with auto-reload
uvicorn app.main:app --reload --port 8000

# Output should show:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

### 5.2 Start Frontend (New Terminal)

```bash
# From project root
cd apps/web

# Start development server
pnpm dev

# Output should show:
# ▲ Next.js 14.x.x
# - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Step 6: Verify Everything Works

### 6.1 Backend Health

```bash
# Test API endpoint
curl http://localhost:8000/health

# Expected response: { "status": "healthy" }
```

### 6.2 API Documentation

Open in browser:
```
http://localhost:8000/docs
```

You should see interactive Swagger documentation.

### 6.3 Frontend

Open in browser:
```
http://localhost:3000
```

You should see the MeatyMusic home page.

### 6.4 Observability Stack

Access monitoring tools:

| Tool | URL | Purpose |
|------|-----|---------|
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3000 | Metrics dashboards |
| Jaeger | http://localhost:16686 | Distributed tracing |

---

## Step 7: Project Structure Tour

### 7.1 Frontend Structure

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── ...routes/          # Additional pages
├── src/
│   ├── components/         # React components
│   ├── lib/                # Utilities and helpers
│   └── hooks/              # Custom hooks
├── public/                 # Static assets
└── package.json            # Dependencies

packages/
├── ui/                     # Component library
│   └── src/components/     # Reusable components
├── tokens/                 # Design tokens
│   └── src/tokens.ts       # Token definitions
├── api/                    # API client
│   └── src/client.ts       # Typed API requests
└── store/                  # State management
    └── src/stores/         # Zustand stores
```

### 7.2 Backend Structure

```
services/api/
├── app/
│   ├── main.py             # FastAPI app initialization
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration
│   │   ├── logging.py      # Logging setup
│   │   └── security.py     # Security utilities
│   ├── db/                 # Database
│   │   ├── session.py      # DB session factory
│   │   └── models.py       # SQLAlchemy models
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   ├── routers/            # API endpoints
│   └── schemas/            # Pydantic schemas
├── migrations/             # Alembic migrations
├── tests/                  # Test suite
└── requirements.txt        # Python dependencies
```

### 7.3 Documentation Structure

```
docs/
├── architecture/           # Architecture docs
├── development/            # Development guides
│   └── getting-started.md  # This file
├── project_plans/
│   └── PRDs/               # Product requirements
├── hit_song_blueprint/     # Music composition rules
└── bootstrap-migration-log.md
```

---

## Development Workflow

### Understanding the Architecture

1. **Read** [CLAUDE.md](../../CLAUDE.md) - Project overview and constraints
2. **Check** [amcs-overview.md](../amcs-overview.md) - System architecture
3. **Review** [PRDs](../project_plans/PRDs/) - Domain specifications
4. **Study** [Blueprints](../hit_song_blueprint/) - Music composition rules

### Typical Development Task

```
1. Identify PRD for task (e.g., "Style Entity")
2. Check "Style Schema" in relevant PRD
3. Create database migration (Alembic)
4. Implement SQLAlchemy model
5. Create repository methods
6. Add service business logic
7. Create API endpoints
8. Write tests (unit, integration, E2E)
9. Update API documentation
10. Create PR with description
```

### Code Patterns

**Backend Repository**:
```python
# patterns/repository.py
class SongRepository(BaseRepository):
    async def get_by_id(self, song_id: UUID) -> Song:
        result = await self.db.execute(
            select(Song).where(Song.id == song_id)
        )
        return result.scalar_one_or_none()

    async def create(self, song: SongCreate) -> Song:
        db_song = Song(**song.dict())
        self.db.add(db_song)
        await self.db.flush()
        return db_song
```

**Frontend Component**:
```typescript
// apps/web/src/components/SongForm.tsx
export const SongForm: React.FC = () => {
  const { mutate: createSong } = useMutation(
    (data: SongCreate) => api.createSong(data)
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createSong(formData);
    }}>
      {/* Form fields */}
    </form>
  );
};
```

---

## Running Tests

### Backend Tests

```bash
cd services/api

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/repositories/test_song.py

# Run with verbose output
pytest -v

# Watch mode (requires pytest-watch)
ptw
```

### Frontend Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

---

## Type Checking

### Backend Type Checking

```bash
cd services/api

# Check types with mypy
mypy app

# Fix common issues
mypy app --show-error-codes
```

### Frontend Type Checking

```bash
# Check TypeScript
pnpm typecheck

# Fix TypeScript errors
pnpm typecheck --listFiles
```

---

## Linting & Formatting

### Backend Linting

```bash
cd services/api

# Check with Ruff
ruff check .

# Fix automatically
ruff check . --fix

# Format with Black
black app
```

### Frontend Linting

```bash
# Lint with ESLint
pnpm lint

# Fix automatically
pnpm lint --fix

# Format with Prettier
pnpm format
```

---

## Database Migrations

### Creating a New Migration

```bash
cd services/api

# Create migration file
alembic revision --autogenerate -m "Add Song entity"

# Review the generated migration in migrations/versions/

# Run the migration
alembic upgrade head
```

### Migration Best Practices

1. **One concept per migration** - Keep migrations focused
2. **Reversible** - Always include `downgrade()` function
3. **Idempotent** - Safe to run multiple times
4. **Test locally** - Verify up/down before committing

Example migration:
```python
# migrations/versions/001_add_songs_table.py
def upgrade():
    op.create_table(
        'songs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'])
    )

def downgrade():
    op.drop_table('songs')
```

---

## Adding a New Component

### Create Component Structure

```bash
# Navigate to component library
cd packages/ui/src/components

# Create component directory
mkdir NewComponent
cd NewComponent

# Create component files
touch NewComponent.tsx
touch NewComponent.stories.tsx
touch index.ts
```

### Component Template

```typescript
// packages/ui/src/components/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### Storybook Stories

```typescript
// packages/ui/src/components/Button/Button.stories.tsx
import { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};
```

---

## Troubleshooting

### Backend Issues

**Problem**: Backend won't start
```bash
# Check if Python environment is activated
which python

# Reinstall dependencies
pip install -e .

# Check for syntax errors
python -m py_compile app/main.py
```

**Problem**: Database connection refused
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

**Problem**: Port 8000 already in use
```bash
# Find process on port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Problem**: Frontend won't build
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check TypeScript
pnpm typecheck
```

**Problem**: Port 3000 already in use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
pnpm dev -- -p 3001
```

**Problem**: Module not found error
```bash
# Build all packages
pnpm build

# Check monorepo links
pnpm list

# Rebuild specific package
pnpm --filter @meatymusic/ui build
```

### Docker Issues

**Problem**: Docker services won't start
```bash
# Check Docker daemon
docker ps

# View service logs
docker-compose logs -f meatymusic-postgres

# Restart services
docker-compose restart

# Clean and restart
docker-compose down
docker-compose up -d
```

**Problem**: Database already exists
```bash
# Remove volume (warning: deletes data)
docker-compose down -v

# Restart services
docker-compose up -d
```

---

## Next Steps

After setup, continue with:

1. **Understand Architecture**
   - Read [CLAUDE.md](../../CLAUDE.md) (20 min)
   - Review [PRDs](../project_plans/PRDs/) relevant to your work (15 min)

2. **Make a Small Change**
   - Fix a TODO comment
   - Update documentation
   - Add a component story

3. **Create Your First PR**
   - Follow contribution guidelines
   - Write descriptive commit messages
   - Request review from team

4. **Contribute to Phase 2**
   - Database schema design
   - Entity implementation
   - API endpoint creation

---

## Resources

### Documentation
- [CLAUDE.md](../../CLAUDE.md) - Project overview
- [amcs-overview.md](../amcs-overview.md) - System architecture
- [bootstrap-migration-log.md](../bootstrap-migration-log.md) - What was inherited
- [architecture-diff.md](../architecture-diff.md) - Comparison with MeatyPrompts

### Product Specs
- [PRDs](../project_plans/PRDs/) - Domain specifications
- [Hit Song Blueprints](../hit_song_blueprint/) - Music composition rules
- [Implementation Plans](../project_plans/) - Phase breakdown

### External Links
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [React Docs](https://react.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## FAQ

**Q: Can I develop without Docker?**
A: Yes, but Docker is recommended for database and Redis. You can install PostgreSQL and Redis locally instead.

**Q: What if I need to modify the database schema?**
A: Create an Alembic migration: `alembic revision --autogenerate -m "Description"`

**Q: How do I update dependencies?**
A: Use `pnpm upgrade` for frontend, `pip install --upgrade` for backend.

**Q: Where do I add new features?**
A: Check PRDs in `docs/project_plans/PRDs/` to understand the domain, then implement following the architecture patterns.

**Q: How do I run tests?**
A: Frontend: `pnpm test`, Backend: `pytest`

---

## Getting Help

- **Questions**: Check documentation and comments in code
- **Issues**: Create GitHub issue with reproduction steps
- **Architecture**: Ask in team chat or create discussion
- **Code Review**: Submit PR with detailed description

---

**Last Updated**: 2025-11-12
**Next Review**: After Phase 2 launch

Happy coding!
