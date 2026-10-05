# Step by step: run it, then understand it

Work through this in order. Each step says what to look at, what to try, and a small exercise. Commit to git after each step.

## Step 0: Get it running

Follow the Quick start in `README.md`. If you do not want Docker, install Postgres directly on Arch/CachyOS:

```bash
sudo pacman -S postgresql
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER store WITH PASSWORD 'store' CREATEDB;"
sudo -u postgres createdb -O store store
sudo -u postgres createdb -O store store_test
```

Then continue from step 2 of the Quick start. The default `.env.example` URLs already match these names.

**Check:** `npm test` passes, and http://localhost:5173 shows four sample items.

## Step 1: The server skeleton and database

**Look at:** `server/src/config.ts`, `db/pool.ts`, `db/schema.ts`, `db/migrate.ts`, `app.ts`, `index.ts`

Key ideas:
- `config.ts` reads `.env` once and fails loudly if something required is missing. Nothing else touches `process.env` directly.
- `schema.ts` uses `CREATE TABLE IF NOT EXISTS`, so running it twice is harmless. That is a tiny "migration" system. Tools like Prisma or node-pg-migrate are the next level up.
- Money is stored as integer cents (`price_cents`). Floating point numbers cause rounding bugs.
- `createApp()` builds the Express app without starting it. Tests import it directly and never need a port.

**Try:**
```bash
curl localhost:4000/api/health
curl localhost:4000/api/items
```
**Exercise:** add a `category` column to `items` in `schema.ts` (`ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''`), run `npm run migrate`, and return it from the API.

## Step 2: Accounts and login

**Look at:** `server/src/routes/auth.ts`, `middleware/auth.ts`, `tests/auth.test.ts`

Key ideas:
- Passwords are hashed with bcrypt. The plain password is never stored or returned.
- Login sets a JWT in an **httpOnly cookie**. JavaScript on the page cannot read it, which protects it from most script-injection theft. `sameSite: 'lax'` and `secure` in production add more protection.
- `loadUser` runs on every request and fills `req.user` when the cookie is valid. `requireAuth` and `requireAdmin` are small gates you put in front of routes.
- Wrong email and wrong password give the same error message on purpose.
- zod validates input at the edge, so the rest of the code can trust it.

**Try** (the `-c`/`-b` flags save and send cookies like a browser):
```bash
curl -c jar.txt -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"YOUR-ADMIN-PASSWORD"}' localhost:4000/api/auth/login
curl -b jar.txt localhost:4000/api/auth/me
```
**Exercise:** add `express-rate-limit` to `/api/auth/login` (for example 10 attempts per 15 minutes) and write a test for it.

## Step 3: Items and the admin gate

**Look at:** `server/src/routes/items.ts`, `tests/items.test.ts`

Key ideas:
- Reading items is public. Create, update and delete sit behind `requireAdmin`.
- **Never trust the browser for permissions.** Hiding the admin menu in React is only cosmetics; the server check is the real lock. The tests prove a customer gets 403 and a visitor gets 401.
- Every SQL query uses `$1, $2` placeholders. That is what prevents SQL injection. Never build SQL by gluing strings.

**Try:**
```bash
curl -b jar.txt -H 'Content-Type: application/json' \
  -d '{"name":"Lamp","description":"Desk lamp","price_cents":2500,"stock":3}' localhost:4000/api/items
```
Run the same command without `-b jar.txt` and see the 401.

**Exercise:** add `GET /api/items?inStock=true` that only returns items with stock above 0.

## Step 4: Orders

**Look at:** `server/src/routes/orders.ts`, `tests/orders.test.ts`

Key ideas:
- The browser sends only item ids and quantities. Prices come from the database, so nobody can edit a price in dev tools.
- Everything happens in a **transaction** (`BEGIN`, `COMMIT`, `ROLLBACK`). If any item is out of stock, nothing changes.
- `SELECT … FOR UPDATE` locks the row so two buyers cannot both take the last item.
- `order_items` copies the item name and price at purchase time, so history stays correct even if the item changes later.

**Exercise:** add an admin-only `GET /api/admin/orders` that lists every order with the customer's name.

## Step 5: The React client

**Look at:** `client/src/main.tsx`, `App.tsx`, `context/`, `lib/api.ts`, `pages/`

Key ideas:
- `lib/api.ts` is the only place that calls `fetch`. It sends cookies and turns server errors into readable messages.
- `AuthContext` asks `/api/auth/me` on load, so a refresh keeps you logged in. `ProtectedRoute` redirects visitors to the login page.
- The cart lives in `lib/cartReducer.ts` as a plain function, which makes it easy to test. `CartContext` saves it to `localStorage`.
- In development Vite's proxy (`vite.config.ts`) forwards `/api` to Express, so the browser sees one origin and no CORS setup is needed. In production Express serves the built client itself, which gives the same single origin.
- Styling is Tailwind utility classes. The brand colours are defined once in `client/src/index.css` under `@theme`; change `--color-brand` and the whole site follows.

**Exercise:** build an item detail page at `/items/:id` using `GET /api/items/:id` (the endpoint already exists).

## Step 6: Tests, and why they are shaped this way

- **Server tests** run against the real `store_test` database. `tests/setup.ts` refuses to run unless `TEST_DATABASE_URL` is set, and wipes tables before each test, so tests never touch your dev data.
- `tests/helpers.ts` gives you `signedUpAgent()` and `adminAgent()`. A Supertest *agent* keeps cookies, like a browser tab.
- **Client tests** cover the cart logic and one component. Pure functions like the reducer are the cheapest things to test well.
- **CI** (`.github/workflows/ci.yml`) starts a Postgres container and runs both suites on every push.

**Exercise:** write a failing test first for a new rule ("max 10 of one item per order"), watch it fail, then make it pass. That loop is test-driven development.

## Step 7: Deploy

Follow `docs/DEPLOY.md`. Do it once end to end, even if the site is rough; deploying early finds the boring problems (SSL, environment variables) while they are cheap to fix.

## Where to go next

1. Replace placeholder letters with real item images (Cloudinary free tier).
2. Pagination and category filters.
3. A Playwright test that signs up, adds to cart and orders.
4. Stripe in test mode for real checkout flow.
5. Put it on your resume: "Full-stack store with role-based auth, transactional orders, automated tests and CI, deployed on Render and Aiven."
