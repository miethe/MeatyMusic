# Makefile for MeatyMusic Docker Development
# Provides convenient shortcuts for common Docker Compose commands

.PHONY: help build up down restart logs clean migrate shell-api shell-web shell-db test

# Default target
help:
	@echo "MeatyMusic Docker Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (copy env files)"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo ""
	@echo "Development:"
	@echo "  make dev-mode       - Setup development mode with hot reload"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-api       - View API logs"
	@echo "  make logs-web       - View web logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make migrate-create - Create new migration (use MSG='description')"
	@echo "  make migrate-down   - Rollback last migration"
	@echo "  make shell-db       - Connect to PostgreSQL shell"
	@echo ""
	@echo "Shells:"
	@echo "  make shell-api      - Open shell in API container"
	@echo "  make shell-web      - Open shell in web container"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-api       - Run API tests"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          - Stop services and remove volumes"
	@echo "  make reset          - Complete reset (clean + rebuild)"
	@echo "  make ps             - Show running containers"
	@echo "  make health         - Check service health"

# Docker Compose command with env file
DC := docker-compose --env-file .env.docker

# Initial setup
setup:
	@if [ ! -f .env.docker ]; then \
		echo "Creating .env.docker from example..."; \
		cp .env.docker.example .env.docker; \
		echo ""; \
		echo "✅ Created .env.docker"; \
		echo "⚠️  IMPORTANT: Edit .env.docker and add your Clerk credentials!"; \
		echo ""; \
	else \
		echo ".env.docker already exists"; \
	fi

# Development mode setup
dev-mode:
	@if [ ! -f docker-compose.override.yml ]; then \
		echo "Setting up development mode with hot reload..."; \
		cp docker-compose.override.yml.example docker-compose.override.yml; \
		echo "✅ Created docker-compose.override.yml"; \
		echo ""; \
	else \
		echo "docker-compose.override.yml already exists"; \
	fi

# Build services
build:
	$(DC) build

# Start services
up: setup
	$(DC) up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "Web: http://localhost:3000"
	@echo "API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Stop services
down:
	$(DC) down

# Restart services
restart:
	$(DC) restart

# View logs
logs:
	$(DC) logs -f

logs-api:
	$(DC) logs -f api

logs-web:
	$(DC) logs -f web

logs-db:
	$(DC) logs -f postgres

# Database operations
migrate:
	$(DC) exec api alembic upgrade head

migrate-create:
	@if [ -z "$(MSG)" ]; then \
		echo "Usage: make migrate-create MSG='your migration description'"; \
		exit 1; \
	fi
	$(DC) exec api alembic revision --autogenerate -m "$(MSG)"

migrate-down:
	$(DC) exec api alembic downgrade -1

migrate-history:
	$(DC) exec api alembic history

# Shell access
shell-api:
	$(DC) exec api sh

shell-web:
	$(DC) exec web sh

shell-db:
	$(DC) exec postgres psql -U mm_user -d meaty_music_dev

shell-redis:
	$(DC) exec redis redis-cli

# Testing
test: test-api

test-api:
	$(DC) exec api pytest

test-api-verbose:
	$(DC) exec api pytest -v

test-api-coverage:
	$(DC) exec api pytest --cov=app --cov-report=html

# Maintenance
ps:
	$(DC) ps

health:
	@echo "Checking service health..."
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:8000/healthz | jq . || echo "❌ API not responding"
	@echo ""
	@echo "Web Health:"
	@curl -s http://localhost:3000/api/health | jq . || echo "❌ Web not responding"
	@echo ""
	@echo "PostgreSQL:"
	@$(DC) exec -T postgres pg_isready -U mm_user || echo "❌ PostgreSQL not ready"
	@echo ""
	@echo "Redis:"
	@$(DC) exec -T redis redis-cli ping || echo "❌ Redis not responding"

clean:
	$(DC) down -v
	@echo "✅ Stopped services and removed volumes"

reset: clean
	$(DC) build --no-cache
	$(DC) up -d
	@echo "✅ Complete reset done"

# Rebuild specific service
rebuild-api:
	$(DC) build --no-cache api
	$(DC) up -d api

rebuild-web:
	$(DC) build --no-cache web
	$(DC) up -d web
