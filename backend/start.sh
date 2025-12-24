#!/bin/sh
set -e

echo "🚀 Starting TUNING backend..."

# Check if database exists
if [ ! -f "/app/backend/data/hospital.db" ]; then
  echo "📦 Database not found, initializing..."
  node /app/backend/dist/db/init.js

  echo "🌱 Seeding database..."
  node /app/backend/dist/db/seed.js
else
  echo "✅ Database already exists"
fi

echo "🎬 Starting server..."
exec node /app/backend/dist/server.js
