# Production pre-flight checklist

Before sharing the URL with friends:

- [ ] PostgreSQL running with daily backups configured ([RUNBOOK.md](./RUNBOOK.md))
- [ ] `AUTH_URL` matches public HTTPS domain
- [ ] Discord OAuth redirect includes `/api/auth/callback/discord`
- [ ] `AUTH_SECRET` and `BOT_API_SECRET` are 16+ random characters
- [ ] `NODE_ENV=production` — no dev sign-in on home page
- [ ] `docker compose up` healthy; `GET /api/health` returns `ok: true`
- [ ] Upload volume mounted (or S3 env vars set)
- [ ] GitHub CI green on `main`
- [ ] Smoke test: Discord sign-in → post availability → create campaign
- [ ] Privacy page linked from landing (`/privacy`)
