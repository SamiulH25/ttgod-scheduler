#!/bin/sh
# Usage: ./scripts/backup-db.sh [compose-project-dir]
set -e
DIR="${1:-.}"
cd "$DIR"
OUT="backup-$(date +%Y-%m-%dT%H%M%S).sql"
docker compose exec -T postgres pg_dump -U ttgod ttgod > "$OUT"
echo "Wrote $OUT"
