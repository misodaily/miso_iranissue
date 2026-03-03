#!/bin/bash
# Initialize database and run Alembic migrations
set -e

echo "🔧 Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-admin}" 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL ready"

echo "📦 Running Alembic migrations..."
docker compose exec backend alembic upgrade head

echo "✅ Database initialized"
