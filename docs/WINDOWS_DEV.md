# Windows local development (no Docker)

If `npm run dev` fails with:

```text
the URL must start with the protocol postgresql:// or postgres://
```

your `.env` still has the old SQLite URL (`file:./dev.db`). The app now uses **PostgreSQL only**.

## Fix in 3 steps

### 1. Install PostgreSQL

**Option A — Docker Desktop** (then `npm run db:dev` works):

- Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Restart the terminal, then:
  ```powershell
  npm run db:dev
  ```

**Option B — Native PostgreSQL** (no Docker):

```powershell
winget install PostgreSQL.PostgreSQL.16
```

During setup, note the password for the `postgres` user. Ensure the service is running (Services → `postgresql-x64-16`).

### 2. Create a database

Open **SQL Shell (psql)** or pgAdmin and run:

```sql
CREATE USER ttgod WITH PASSWORD 'ttgod_dev_password';
CREATE DATABASE ttgod OWNER ttgod;
```

Or use only the default `postgres` user if you prefer.

### 3. Update `.env`

Replace `DATABASE_URL` in your `.env` (do not commit this file):

```env
DATABASE_URL="postgresql://ttgod:ttgod_dev_password@localhost:5432/ttgod?schema=public"
```

If you use the default `postgres` superuser:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ttgod?schema=public"
```

Then apply migrations and start the app:

```powershell
npm run db:migrate
npm run dev
```

Open http://localhost:3000

## Old SQLite data

The previous `prisma/dev.db` file is **not** used anymore. There is no automatic migration from SQLite to Postgres; start fresh or export/import manually if you need old rows.

## Still stuck?

| Symptom | Fix |
|---------|-----|
| `'docker' is not recognized` | Install Docker Desktop **or** use native PostgreSQL (Option B above) |
| `connection refused` on 5432 | Start PostgreSQL service; check host/port in `DATABASE_URL` |
| `database "ttgod" does not exist` | Run the `CREATE DATABASE` SQL above |
| Delete slot → 500 / P2025 | Pull latest `main`; delete is idempotent (404 if already gone) |
