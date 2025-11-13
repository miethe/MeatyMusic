#!/bin/bash
# Infrastructure Setup Script for MeatyMusic AMCS
# This script initializes PostgreSQL, Redis, and runs database migrations

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}MeatyMusic Infrastructure Setup${NC}"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is running"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✓${NC} docker-compose.yml found"

# Start PostgreSQL and Redis
echo ""
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo ""
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U mm_user -d meaty_music_dev > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL is ready"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: PostgreSQL failed to start${NC}"
        docker-compose logs postgres
        exit 1
    fi

    echo "Attempt $i/30: Waiting for PostgreSQL..."
    sleep 2
done

# Wait for Redis to be ready
echo ""
echo "Waiting for Redis to be ready..."
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is ready"
        break
    fi

    if [ $i -eq 15 ]; then
        echo -e "${RED}Error: Redis failed to start${NC}"
        docker-compose logs redis
        exit 1
    fi

    echo "Attempt $i/15: Waiting for Redis..."
    sleep 2
done

# Run database migrations
echo ""
echo "Running database migrations..."
cd services/api

if alembic upgrade head; then
    echo -e "${GREEN}✓${NC} Migrations completed successfully"
else
    echo -e "${RED}Error: Migration failed${NC}"
    exit 1
fi

cd ../..

# Verify database tables
echo ""
echo "Verifying database tables..."
if docker-compose exec -T postgres psql -U mm_user -d meaty_music_dev -c "\dt" > /tmp/mm_tables.txt 2>&1; then
    echo -e "${GREEN}✓${NC} Database tables created:"
    grep "public |" /tmp/mm_tables.txt || echo "  (checking tables...)"

    # Check for required tables
    for table in tenants users user_preferences; do
        if grep -q "$table" /tmp/mm_tables.txt; then
            echo -e "  ${GREEN}✓${NC} $table"
        else
            echo -e "  ${RED}✗${NC} $table (missing)"
        fi
    done
else
    echo -e "${YELLOW}Warning: Could not verify tables${NC}"
fi

# Test Redis connection
echo ""
echo "Testing Redis connection..."
if docker-compose exec -T redis redis-cli set test_key "test_value" > /dev/null 2>&1; then
    VALUE=$(docker-compose exec -T redis redis-cli get test_key 2>/dev/null | tr -d '\r')
    if [ "$VALUE" == "test_value" ]; then
        echo -e "${GREEN}✓${NC} Redis SET/GET operations working"
        docker-compose exec -T redis redis-cli del test_key > /dev/null 2>&1
    else
        echo -e "${YELLOW}Warning: Redis GET returned unexpected value${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Could not test Redis operations${NC}"
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}Infrastructure Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Database: meaty_music_dev"
echo "User: mm_user"
echo ""
echo "Next steps:"
echo "  1. Review the logs: docker-compose logs -f"
echo "  2. Start the API: cd services/api && uvicorn main:app --reload"
echo "  3. Access API docs: http://localhost:8000/docs"
echo ""
