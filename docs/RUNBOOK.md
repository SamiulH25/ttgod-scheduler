# Operations runbook

## Health checks

| Endpoint | Expected |
|----------|----------|
| `GET /api/health` | `{ "ok": true, "db": "connected" }` |
| `GET /api/bot/v1/health` + Bearer | `{ "ok": true, "version": "1" }` |

## Deploy new version

```bash
cd /path/to/app
git pull
docker compose pull app
docker compose up -d
docker compose exec app npx prisma migrate deploy
curl -fsS https://YOUR_DOMAIN/api/health
```

## Rollback

```bash
docker compose pull app  # previous tag from GHCR
# or: docker tag ghcr.io/OWNER/REPO:PREVIOUS ghcr.io/OWNER/REPO:latest
docker compose up -d
```

## Database backup

Daily on the host (adjust paths):

```bash
docker compose exec -T postgres pg_dump -U ttgod ttgod > backup-$(date +%F).sql
```

Restore:

```bash
cat backup-YYYY-MM-DD.sql | docker compose exec -T postgres psql -U ttgod ttgod
```

Upload volume backup: archive `data/uploads` or sync S3 bucket.

## Rotate `BOT_API_SECRET`

1. Generate a new secret.
2. Update bot service and `.env` on the app host.
3. `docker compose up -d` to reload app.
4. Revoke old secret in bot config.

## Site down checklist

1. `docker compose ps` — are `app` and `postgres` running?
2. `curl localhost:3000/api/health` on the server.
3. Check app logs: `docker compose logs app --tail=100`
4. Postgres: `docker compose logs postgres --tail=50`
5. Disk full? `df -h`
6. Discord OAuth redirect URL matches `AUTH_URL`

## Discord OAuth URL change

Update redirect in Discord Developer Portal and `AUTH_URL` in `.env`, then restart app.
