#!/bin/sh
set -e

# The dedicated Atelier Neon resource is the source of truth.  Mirror it to
# DATABASE_URL as well so the migration guard below evaluates the same
# connection that Prisma uses in schema.prisma.
if [ -n "$ATELIERNEW_DATABASE_URL" ]; then
  export DATABASE_URL="$ATELIERNEW_DATABASE_URL"
fi

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

# Migrations are intentionally not run during web builds. Vercel can run
# multiple builds concurrently and Prisma's advisory lock then causes P3009
# / lock errors even when the production schema is fully up to date. Apply
# migrations as an explicit release operation before deploying code that
# depends on them; builds only generate Prisma and compile the application.
echo "Skipping Prisma migrations during the Vercel build."

npx next build
