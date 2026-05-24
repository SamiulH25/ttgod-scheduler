# Gitea setup (mirror + deploy)

Use **GitHub as the source of truth** for code and CI. Use **Gitea** on your server for mirroring, optional Actions, and hosting the running app next to your Gitea instance.

## 1. GitHub repository

The project is pushed to GitHub (private recommended for a friends-only beta).

- Clone: `git clone https://github.com/SamiulH25/ttgod-scheduler.git`
- **README on GitHub** has the full Gitea walkthrough at the top of the repo.
- CI runs on every push to `main` / `master` (see `.github/workflows/ci.yml`).

Do **not** commit `.env` or any tokens. Copy `.env.example` to `.env` on the server only.

## 2. Create a Gitea repository

1. Log in to your Gitea instance (e.g. `https://git.yourdomain.com`).
2. **+** → **New Repository**.
3. Name: `ttgod-scheduler` (match GitHub for clarity).
4. Visibility: **Private** for friends beta.
5. **Do not** initialize with README (you will mirror from GitHub).
6. Create repository.

Note the clone URL, e.g. `https://git.yourdomain.com/youruser/ttgod-scheduler.git`.

## 3. Mirror from GitHub (recommended)

### Option A — Gitea “Mirror” repository (easiest)

1. In Gitea: **New Migration** (or **New Repository** → **Migrate Repository**).
2. **GitHub** / **Git** URL: `https://github.com/SamiulH25/ttgod-scheduler.git`
3. For a **private** GitHub repo, use a **GitHub Personal Access Token** (classic, `repo` scope) as the password; username = your GitHub username.
4. Enable **Mirror** / **Sync periodically** (e.g. every 8h or on push via webhook).
5. Migrate.

Gitea will pull from GitHub on a schedule. Deploy from Gitea’s copy or still deploy from GitHub Actions—your choice.

### Option B — Push mirror from your machine

```bash
git clone https://github.com/SamiulH25/ttgod-scheduler.git
cd ttgod-scheduler
git remote add gitea https://git.yourdomain.com/youruser/ttgod-scheduler.git
git push gitea main   # or master
```

Repeat `git push gitea main` after GitHub updates, or automate with a cron job.

### Option C — Webhook (GitHub → Gitea pull)

On GitHub: **Settings → Webhooks → Add** → payload URL = Gitea mirror sync endpoint (if your Gitea version supports it), or use a small script on the server that runs `git fetch` in a bare mirror.

## 4. Run the app on the same server as Gitea

On the VPS/homelab where Gitea runs:

```bash
# Install Docker if needed
sudo apt update && sudo apt install -y docker.io docker-compose-plugin

# App directory (outside Gitea’s data dir)
sudo mkdir -p /opt/ttgod-scheduler
sudo chown $USER:$USER /opt/ttgod-scheduler
cd /opt/ttgod-scheduler

# Get code from Gitea mirror or GitHub
git clone https://git.yourdomain.com/youruser/ttgod-scheduler.git .

# Configure secrets (never commit this file)
cp .env.example .env
nano .env   # DATABASE_URL, AUTH_*, BOT_API_SECRET, AUTH_URL=https://schedule.yourdomain.com

# Start Postgres + app
docker compose up -d --build

# Check health
curl -s http://127.0.0.1:3000/api/health
```

Put **Caddy** or **nginx** in front for HTTPS:

- `schedule.yourdomain.com` → `http://127.0.0.1:3000`
- Register Discord OAuth redirect: `https://schedule.yourdomain.com/api/auth/callback/discord`

Full details: [DEPLOY.md](./DEPLOY.md), [RUNBOOK.md](./RUNBOOK.md), [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

## 5. Gitea Actions (optional)

If your Gitea has **Actions** enabled:

1. Copy `.github/workflows/ci.yml` to `.gitea/workflows/ci.yml` (same content works on many Gitea versions).
2. Register runners in Gitea admin.
3. Set repository secrets: `DATABASE_URL` (CI Postgres is in the workflow), `AUTH_SECRET`, etc.

Many teams skip this and rely on **GitHub Actions** only, using Gitea purely as a mirror + `git pull` deploy target.

## 6. Deploy updates

**From GitHub (GHCR + SSH)** — see `.github/workflows/deploy.yml`:

- Enable workflow `Deploy` manually with `deploy_to_vps: true`.
- Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` (`/opt/ttgod-scheduler`).

**From Gitea server directly:**

```bash
cd /opt/ttgod-scheduler
git pull origin main
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
curl -fsS https://schedule.yourdomain.com/api/health
```

## 7. Backups

- Database: [RUNBOOK.md](./RUNBOOK.md) (`pg_dump` cron).
- Uploads: Docker volume `upload_data` or S3—see [TECH.md](./TECH.md).

## Quick reference

| Item | GitHub | Gitea |
|------|--------|--------|
| Primary git remote | Yes | Mirror optional |
| CI | `.github/workflows/ci.yml` | Optional duplicate |
| Secrets / `.env` | GitHub Secrets for deploy | Server `.env` only |
| Friends access | Discord OAuth on app URL | Same app URL |
