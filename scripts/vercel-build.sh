#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ] || echo "$DATABASE_URL" | grep -q '^file:'; then
  if [ -n "$POSTGRES_PRISMA_URL" ]; then
    export DATABASE_URL="$POSTGRES_PRISMA_URL"
  elif [ -n "$POSTGRES_URL" ]; then
    export DATABASE_URL="$POSTGRES_URL"
  elif [ -n "$POSTGRES_URL_NON_POOLING" ]; then
    export DATABASE_URL="$POSTGRES_URL_NON_POOLING"
  fi
fi

sh scripts/prisma-generate.sh

if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q '^postgres'; then
  npx prisma migrate deploy
else
  echo "Skipping prisma migrate deploy (no PostgreSQL DATABASE_URL)."
fi

npx next build
