#!/bin/sh
set -e
# prisma generate reads schema env() vars even when it does not connect.
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-${POSTGRES_URL_NON_POOLING:-postgresql://prisma:prisma@127.0.0.1:5432/prisma}}}}"
exec npx prisma generate
