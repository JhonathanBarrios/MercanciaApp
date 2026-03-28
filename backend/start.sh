#!/bin/bash
set -e

echo "🔧 Running Prisma migrations..."
npx prisma migrate deploy --verbose

echo "🌱 Running seed..."
npx prisma db seed --verbose

echo "🚀 Starting NestJS..."
node dist/main
