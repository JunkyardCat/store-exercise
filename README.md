# Store

A small online store: customers sign up, log in, browse items, fill a cart and place orders; an admin manages the items.

**Stack:** React + TypeScript + Vite + Tailwind CSS 4 (client), Express + TypeScript (server), PostgreSQL, JWT in an httpOnly cookie, Vitest + Supertest + React Testing Library (tests).

```
store/
  client/   React app (Vite)
  server/   Express API, database schema, tests
  docs/     STEP-BY-STEP.md (learn how it works), DEPLOY.md (Render + Aiven)
```

## Quick start (local)

You need Node 20+ and a Postgres database. On Arch/CachyOS:

```bash
sudo pacman -S nodejs npm docker docker-compose
sudo systemctl enable --now docker
```

1. **Start Postgres** (creates the `store` and `store_test` databases):
   ```bash
   docker compose up -d
   ```
   No Docker? See "Postgres without Docker" in `docs/STEP-BY-STEP.md`.
2. **Install everything** (root, server and client):
   ```bash
   npm install
   npm run install:all
   ```
3. **Create your `.env`:**
   ```bash
   cp server/.env.example server/.env
   ```
   Open `server/.env` and set `JWT_SECRET` to a long random value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Also set `ADMIN_EMAIL` and `ADMIN_PASSWORD`: this becomes your admin login.
4. **Create tables, the admin account and sample items:**
   ```bash
   npm run seed
   ```
5. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173. The API runs on port 4000, and Vite forwards `/api` to it.

Log in with your admin email and password to see **Manage items** in the menu. Sign up with another email to try the customer side.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Server (auto-restart) and client together |
| `npm test` | All server and client tests |
| `npm run test --prefix server` | API tests only (needs Postgres running) |
| `npm run seed` | Create tables, admin user, sample items (safe to re-run) |
| `npm run build` | Production build of client and server |
| `npm start` | Apply schema, then run the production server |

## Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `TEST_DATABASE_URL` | A **separate** database for tests. Tests wipe its tables, and refuse to run without it |
| `JWT_SECRET` | Signs login cookies. Keep it secret and long |
| `DATABASE_SSL` | `true` for hosted databases such as Aiven |
| `DATABASE_CA` | Optional: Aiven CA certificate text, to fully verify the connection |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by `npm run seed` to create the admin |
| `PORT` | API port (Render sets this for you) |

`.env` is in `.gitignore`. Commit only `.env.example`.

## Tests

- **Server:** 15 tests covering signup, login, logout, admin-only item routes, validation, ordering, stock limits and rollback.
- **Client:** 9 tests for the cart logic, price formatting and the item card.
- **CI:** `.github/workflows/ci.yml` runs everything on every push to GitHub.

## Deploying free

Follow `docs/DEPLOY.md` (Render for the app, Aiven for the database).

## Ideas for next steps

Product images upload (Cloudinary), pagination, order status for admins, Stripe test-mode checkout, a Playwright end-to-end test, password reset by email.
