# Deploy for free: Render + Aiven

The app is one Render web service: Express serves the API and the built React files. The database lives on Aiven.

## What to expect on free tiers

- **Render web service sleeps** after 15 minutes without traffic. The first visit afterwards takes roughly a minute to wake up while visitors see a loading page. Mention this in your portfolio or README.
- **Aiven free Postgres** has no time limit, but it is small (1 GB disk), is not covered by an SLA, has no backup retention, and Aiven may shut down services that go unused for some time. Keep your schema and seed in code (they are) so you can rebuild.
- **Render's own free Postgres expires**, which is why we use Aiven.
- Render's disk is temporary. Do not save uploaded files on the server; store image URLs instead.
- Free plans change. Check the current Render and Aiven pricing pages before you start.

## Step 1: Put the code on GitHub

```bash
git init
git add .
git commit -m "Initial store"
git branch -M main
git remote add origin git@github.com:YOUR-USER/store.git
git push -u origin main
```

Check that `server/.env` is **not** in the repository (it is ignored by `.gitignore`).

## Step 2: Create the Aiven database

1. In the Aiven console create a new service: **PostgreSQL**, choose the **Free** plan.
2. Wait until it shows **Running**.
3. On the service overview copy the **Service URI**. It looks like:
   `postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require`
4. **Delete `?sslmode=require` from the end of the URI.** Our code turns SSL on with `DATABASE_SSL=true`. If the query string stays, the `pg` library can override that and fail with a "self-signed certificate" error.
5. Optional but better: download the **CA certificate** from the same page and keep its text for `DATABASE_CA`.
6. If connections time out, check the service's allowed IP addresses in Aiven and make sure the service is reachable from the internet.

## Step 3: Create the tables and your admin account

Render's free plan has no shell, so run the seed from your own computer, pointed at Aiven:

```bash
cd server
DATABASE_URL='postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb' \
DATABASE_SSL=true \
JWT_SECRET=anything \
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD='a-strong-password' \
npm run seed
```

You should see "Admin account ready" and "Inserted 4 sample items". (The app also applies the schema on every start, so only the admin and sample items need this step.)

## Step 4: Create the Render web service

1. Render dashboard, **New**, **Web Service**, connect your GitHub repository.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free
3. Environment variables:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Aiven URI without `?sslmode=require` |
   | `DATABASE_SSL` | `true` |
   | `DATABASE_CA` | (optional) the CA certificate text |
   | `JWT_SECRET` | a new long random string (not the one from your laptop) |

4. Deploy. When the log shows "API listening", open your `https://….onrender.com` URL.

## Step 5: Check it

- The shop shows the sample items.
- Log in with the admin email you used in step 3 and add an item.
- Sign up as a customer in a private window and place an order.
- `https://YOUR-APP.onrender.com/api/health` returns `{"ok":true}`.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `self-signed certificate in certificate chain` | `?sslmode=require` is still in `DATABASE_URL`, or set `DATABASE_CA` |
| `no pg_hba.conf entry` / SSL required | `DATABASE_SSL` is not `true` |
| Connection timeout | Aiven IP allow-list, or the service is powered off |
| Build fails on `tsc` | Make sure the build command is `npm run build` at the repo root |
| Login works locally but not on Render | `JWT_SECRET` missing, or you are opening the site over plain http |
| First page load is very slow | Free instance waking up |
