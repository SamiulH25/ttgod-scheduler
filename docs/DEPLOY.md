# Deployment guide

## Architecture

- **App:** Next.js 15 standalone in Docker
- **Database:** PostgreSQL 16
- **Uploads:** Docker volume (`local`) or S3-compatible storage
- **Auth:** Discord OAuth (Auth.js v5)
- **CI:** GitHub Actions → GHCR image → optional SSH deploy

## Prerequisites

- Docker and Docker Compose on the VPS
- Discord application with OAuth redirect: `https://YOUR_DOMAIN/api/auth/callback/discord`
- Secrets: `AUTH_SECRET`, `AUTH_DISCORD_*`, `BOT_API_SECRET`, `POSTGRES_PASSWORD`

## First-time setup

1. Clone the repo on the server (or pull from GitHub; Gitea can mirror the same remote).
2. Copy `.env.example` to `.env` and fill production values.
3. Set `AUTH_URL` to your public HTTPS URL.
4. Build and start:

```bash
docker compose up -d --build
```

5. Migrations run automatically via `docker/entrypoint.sh`.
6. Verify: `curl https://YOUR_DOMAIN/api/health`

## Local development with Postgres

```bash
docker compose -f docker-compose.dev.yml up -d postgres
cp .env.example .env
npm run db:migrate
npm run dev
```

## Gitea + GitHub

- **Recommended:** GitHub is the source of truth; enable mirroring in Gitea if you want a second remote.
- Run the same `.github/workflows/ci.yml` on Gitea Actions (duplicate workflow) or rely on GitHub CI before merge.
- Deploy workflow (`deploy.yml`) pushes to `ghcr.io/<owner>/<repo>` and optionally SSHs to your VPS when `deploy_to_vps` is enabled.

## GitHub Actions secrets (deploy)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | VPS hostname |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key |
| `DEPLOY_PATH` | Path to `docker-compose.yml` on server |

## TLS (optional Caddy)

Uncomment the `caddy` service in `docker-compose.yml` and add a `docker/Caddyfile` with your domain. Point DNS to the VPS.

## PostgreSQL migration note

Production uses a single Postgres baseline migration (`20260525000000_init_postgres`). Existing SQLite dev databases are not auto-migrated; export/import or start fresh for local Postgres.
