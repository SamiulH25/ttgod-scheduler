# TTGOD Scheduler

A scheduling web app for sharing free time, creating events, and integrating with a Discord bot via a versioned REST API.

**Design:** Dark-first playful gaming UI — squad calendar overlaps, hub dashboard, and overlap-to-event flow. _(Screenshot placeholders: add `docs/screenshots/` when capturing the landing, calendar, and dashboard.)_

**GitHub:** https://github.com/SamiulH25/ttgod-scheduler

---

## Gitea setup — mirror this repo and run the site

Use **GitHub** for the canonical repo and CI. Use **Gitea** on your VPS/homelab to mirror the code and run the live app (Docker) next to Gitea.

### Step 1 — Mirror GitHub into Gitea

1. Log in to your Gitea instance (example: `https://git.example.com`).
2. Click **+** → **New Migration** (wording may be **Migrate Repository**).
3. Choose **Git** or **GitHub**.
4. **Clone URL:** `https://github.com/SamiulH25/ttgod-scheduler.git`
5. **Auth (private GitHub repo):**
   - Username: `SamiulH25`
   - Password: a GitHub **Personal Access Token** with `repo` scope (not your GitHub password).
6. Repository name: `ttgod-scheduler`
7. Enable **This repository will be a mirror** (or **Mirror updates**) and set sync interval (e.g. every 8 hours).
8. Run migration.

After sync, your Gitea clone URL will look like: `https://git.example.com/YOUR_GITEA_USER/ttgod-scheduler.git`

**No migration UI?** On your PC:

```bash
git clone https://github.com/SamiulH25/ttgod-scheduler.git
cd ttgod-scheduler
git remote add gitea https://git.example.com/YOUR_GITEA_USER/ttgod-scheduler.git
git push gitea main
```

### Step 2 — Install Docker on the Gitea server

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# log out and back in so docker group applies
```

### Step 3 — Deploy the app beside Gitea

```bash
sudo mkdir -p /opt/ttgod-scheduler
sudo chown $USER:$USER /opt/ttgod-scheduler
cd /opt/ttgod-scheduler

# Pull from your Gitea mirror (replace URL with yours)
git clone https://git.example.com/YOUR_GITEA_USER/ttgod-scheduler.git .

cp .env.example .env
nano .env
```

**Required in `.env` on the server:**

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Set by `docker-compose.yml` default, or leave as compose provides |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://schedule.yourdomain.com` (public HTTPS URL of the app) |
| `AUTH_DISCORD_ID` | From [Discord Developer Portal](https://discord.com/developers/applications) |
| `AUTH_DISCORD_SECRET` | Same app → OAuth2 |
| `BOT_API_SECRET` | Long random string for your Discord bot |
| `NODE_ENV` | `production` |

**Discord OAuth redirect** (same Discord app): add  
`https://schedule.yourdomain.com/api/auth/callback/discord`

Start the stack:

```bash
docker compose up -d --build
curl -s http://127.0.0.1:3000/api/health
```

You should see `{"ok":true,"db":"connected",...}`.

### Step 4 — HTTPS in front of the app

Expose port **3000** only on localhost; put **Caddy** or **nginx** on your public domain.

Example: `schedule.yourdomain.com` → reverse proxy to `http://127.0.0.1:3000`.

See `docker/Caddyfile.example` in the repo. Uncomment the `caddy` service in `docker-compose.yml` if you use the included Caddy container.

### Step 5 — Update the site after GitHub pushes

When GitHub `main` updates, sync Gitea (mirror sync or `git pull` on the server), then:

```bash
cd /opt/ttgod-scheduler
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
curl -fsS https://schedule.yourdomain.com/api/health
```

### Checklist before sharing with friends

- [ ] Gitea mirror shows latest `main` from GitHub
- [ ] `GET /api/health` OK on your public URL
- [ ] Discord sign-in works (no “dev demo” form in production)
- [ ] `.env` never committed to git
- [ ] Postgres backups scheduled — see [docs/RUNBOOK.md](docs/RUNBOOK.md)

**More detail:** [docs/GITEA_SETUP.md](docs/GITEA_SETUP.md) · [docs/DEPLOY.md](docs/DEPLOY.md) · [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

---

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Auth.js** (NextAuth v5) with Discord OAuth
- **Prisma** + PostgreSQL (Docker Compose for local and production)
- **Tailwind CSS** + shadcn-style UI components
- **next-themes** for light / dark / system themes

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL (see `.env.example`) |
| `AUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `AUTH_DISCORD_ID` | Discord application OAuth2 client ID |
| `AUTH_DISCORD_SECRET` | Discord application OAuth2 client secret |
| `AUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `BOT_API_SECRET` | Shared secret for bot → API calls |
| `NEXT_PUBLIC_APP_NAME` | Display name (default: TTGOD Scheduler) |

### 3. Discord OAuth setup

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an application (or use your existing bot app).
3. **OAuth2 → Redirects** add:
   - `http://localhost:3000/api/auth/callback/discord`
4. Copy **Client ID** → `AUTH_DISCORD_ID`
5. Copy **Client Secret** → `AUTH_DISCORD_SECRET`
6. Enable scopes: `identify` (email optional).

Users must sign in on the website at least once so their `discordId` is stored before the bot can access their schedule.

### 4. Database

```bash
npm run db:migrate
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo sign-in (local development only)

When `NODE_ENV=development`, the home page shows a **Local demo only** form. Production expects **Sign in with Discord** only. Profile name and avatar refresh from Discord on each login.

---

## Campaigns (events)

Campaigns move through three phases:

1. **Interest** — squad votes yes/no; optional capacity limit.
2. **Scheduling** — host adds time slots; members vote; host finalizes the winner.
3. **Scheduled** — pinned event with calendar time, accept/decline invites, itinerary.

Optional **cost** with **split evenly** shows per-person share on stickies. **Photos** can be attached anytime from the campaign detail page (`/events/[id]`). Images are stored under `data/uploads/events/` (gitignored).

---


## Bot API (v1)

All bot endpoints require:

```http
Authorization: Bearer <BOT_API_SECRET>
```

Base URL: `https://your-domain.com` (or `http://localhost:3000` in development).

Errors return JSON:

```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

### Health check

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/health
```

Response:

```json
{ "ok": true, "version": "1" }
```

### Get user availability

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/availability?from=2026-05-19T00:00:00.000Z&to=2026-05-26T00:00:00.000Z"
```

Query params `from` and `to` are ISO 8601 datetimes (optional; defaults to current week).

### Replace user availability

`PUT` replaces **all** blocks for that user.

```bash
curl -X PUT -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "start": "2026-05-20T18:00:00.000Z",
        "end": "2026-05-20T22:00:00.000Z",
        "label": "Evening"
      }
    ]
  }' \
  http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/availability
```

### Get user events

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/events?from=2026-05-19T00:00:00.000Z&to=2026-06-19T00:00:00.000Z"
```

### Create event (on behalf of user)

```bash
curl -X POST -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "CREATOR_DISCORD_ID",
    "title": "Raid night",
    "start": "2026-05-22T20:00:00.000Z",
    "end": "2026-05-22T23:00:00.000Z",
    "description": "Optional notes",
    "participantDiscordIds": ["OTHER_DISCORD_ID"]
  }' \
  http://localhost:3000/api/bot/v1/events
```

Response includes `notifyTargets` — all users with availability overlapping the event window. Your bot should DM/mention each `discordId` in `pingTargets` (subset with linked Discord accounts).

### Who is free at a time (before creating an event)

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/availability/free?start=2026-05-22T20:00:00.000Z&end=2026-05-22T23:00:00.000Z"
```

### Get event details

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/events/EVENT_ID
```

### Add participants to an event

```bash
curl -X POST -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "discordIds": ["DISCORD_USER_ID"] }' \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/participants
```

### Event itinerary (plans)

```bash
# Read
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/itinerary

# Replace all plan steps
curl -X PUT -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "title": "Voice lobby", "notes": "General channel", "sortOrder": 0 },
      { "title": "Run", "startsAt": "2026-05-22T21:00:00.000Z", "sortOrder": 1 }
    ]
  }' \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/itinerary
```

Web itinerary page: `/events/EVENT_ID/plans`

### Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid bearer token |
| `USER_NOT_LINKED` | 404 | User never signed in on the website |
| `OVERLAP` | 409 | Availability blocks overlap |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many bot requests (120/min per IP) |
| `BOT_API_DISABLED` | 503 | `BOT_API_SECRET` not configured |

---

## User API (session auth)

Used by the web UI; requires an active Discord login session.

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/availability` | List / create blocks |
| `PATCH/DELETE` | `/api/availability/:id` | Update / delete block |
| `GET/POST` | `/api/events` | List / create events (`notifyTargets` on create) |
| `GET` | `/api/events/free-users?start=&end=` | Preview who is free at a time |
| `GET/PATCH` | `/api/events/:id` | Event detail / update (host) |
| `POST/DELETE` | `/api/events/:id/participants` | Add / remove invitees (host) |
| `GET/POST` | `/api/events/:id/itinerary` | List / add plan items |
| `PATCH/DELETE` | `/api/events/:id/itinerary/:itemId` | Edit / remove plan items |
| `PATCH` | `/api/events/:id/participation` | Accept or decline invite |
| `GET/PATCH` | `/api/user/preferences` | Theme & timezone |
| `GET` | `/api/users` | List users for invite picker |

---

## Production

Friends-beta deployment uses **Docker + PostgreSQL** on your own VPS (or homelab).

| Doc | Contents |
|-----|----------|
| [docs/DEPLOY.md](docs/DEPLOY.md) | Docker Compose, Discord OAuth, GitHub/Gitea CI |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Backups, rollback, incidents |
| [docs/TECH.md](docs/TECH.md) | Auth, rate limits, storage |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Pre-flight before sharing URL |
| [docs/GITEA_SETUP.md](docs/GITEA_SETUP.md) | Mirror from GitHub and run on your Gitea server |

Quick start:

```bash
docker compose -f docker-compose.dev.yml up -d postgres  # local DB
cp .env.example .env && npm run db:migrate && npm run dev
# production:
docker compose up -d --build
```

Health: `GET /api/health`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke (`e2e/smoke.spec.ts`); first run may need `npx playwright install` |
