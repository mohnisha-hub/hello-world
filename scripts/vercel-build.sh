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

if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q '^postgres'; then
  # A prior production deploy partially completed this migration: the
  # bidEndsAt column exists, but Prisma retained a failed migration record.
  # Resolve only that known state; fresh databases never match P3009 here.
  migration_status="$(npx prisma migrate status 2>&1 || true)"
  if echo "$migration_status" | grep -q 'P3009' && echo "$migration_status" | grep -q '20260913165000_add_bid_deadline'; then
    echo "Reconciling the completed bid deadline migration record."
    npx prisma migrate resolve --applied 20260913165000_add_bid_deadline
  fi

  migration_attempt=1
  until npx prisma migrate deploy; do
    if [ "$migration_attempt" -ge 3 ]; then
      echo "Prisma migrations failed after ${migration_attempt} attempts."
      exit 1
    fi
    migration_attempt=$((migration_attempt + 1))
    echo "Migration lock was unavailable; retrying in 5 seconds (attempt ${migration_attempt}/3)."
    sleep 5
  done
else
  echo "Skipping prisma migrate deploy (no PostgreSQL DATABASE_URL)."
fi

npx next build
