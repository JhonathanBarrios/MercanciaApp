#!/bin/bash
set -e

echo "🔧 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Running seed..."
npx prisma db seed

echo "🚀 Starting NestJS..."
node dist/main
