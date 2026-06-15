# Offset — Property Expense Tracker

A private web app to track expenses across your property portfolio. Log every
cost against a property, see where the money goes with charts, attach receipt
photos, and export/import to Excel, CSV or PDF.

Built with **React + Vite + Tailwind v4**, with **Supabase** (Postgres + Auth +
Storage) as the cloud backend.

---

## Features

- **Properties** — add each property; every expense is logged against one.
- **Expenses** — date, amount, category, vendor, payment method, notes.
- **Receipts** — attach a photo/PDF of the bill to any expense.
- **Dashboard** — totals, 12-month trend, spend by category, spend by property.
- **Filter & search** — by property, category, date range, or free text.
- **Export** — Excel (`.xlsx`), CSV, or a formatted PDF report of any filtered view.
- **Import** — bulk-load expenses from an Excel/CSV file (new properties are created automatically).
- **Private login** — only you can see your data (enforced by row-level security).
- **Currency** — defaults to ₹ INR; change it with one env var.

---

## Two ways to run

### 1. Demo mode (zero setup)

Just install and run — no account, no backend. Data is stored **only in this
browser** (great for trying it out, not for real records).

```bash
npm install
npm run dev
```

A yellow "Demo mode" banner reminds you that data isn't synced.

### 2. Cloud mode (recommended — login + sync + receipt storage)

1. Create a free project at <https://supabase.com>.
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. This creates
   the tables, security rules, and the private `receipts` storage bucket.
3. In **Project Settings → API**, copy your **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env` and fill them in:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_CURRENCY=INR
   ```

5. Run it:

   ```bash
   npm install
   npm run dev
   ```

6. Open the app, click **Create one**, and register with your email + password.
   - To skip the email-confirmation step, go to Supabase
     **Authentication → Providers → Email** and turn **"Confirm email"** off.
   - To keep it a single-user app, you can also turn off public sign-ups in
     **Authentication → Providers** once your account exists.

---

## Logins (Google, Apple, email) & Google Drive backup

**Sign-in methods** are handled by Supabase Auth. Email + password works out of
the box. To enable the social buttons:

1. **Google** — in Google Cloud, create an *OAuth 2.0 Web client*, then in the
   Supabase dashboard go to **Authentication → Providers → Google**, paste the
   Client ID + secret, and enable it.
2. **Apple** — needs a paid Apple Developer account. Create a Services ID + key,
   then fill them into **Authentication → Providers → Apple**.
3. In **Authentication → URL Configuration**, set your **Site URL** and add your
   deployed URL (and `http://localhost:5173`) to **Redirect URLs**.

The Google/Apple buttons appear automatically on the login screen in cloud mode.

**Google Drive backup** lets each user connect their *own* Drive and store a
private JSON backup of their data (in the hidden app-data folder), restorable on
any device. Receipts stay in Supabase. To enable it:

1. In Google Cloud, **enable the Google Drive API** and create an *OAuth 2.0 Web
   client* (you can reuse the one above). Add your site to **Authorized
   JavaScript origins**.
2. Put the client ID in `.env` as `VITE_GOOGLE_CLIENT_ID`.
3. A **"Cloud backup — Google Drive"** card appears on the **Reports** page with
   *Back up* / *Restore* buttons.

---

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Production build into `dist/`         |
| `npm run preview` | Preview the production build locally  |

---

## Deploying

This is a static SPA — host the `dist/` folder anywhere (Vercel, Netlify,
Cloudflare Pages, etc.). Set the same `VITE_*` environment variables in your
host's dashboard, then build. On Vercel: import the repo, set the project root
to `expense-tracker/`, framework **Vite**, and add the env vars.

---

## Import / export format

Exports and imports use these columns:

| Date | Property | Category | Vendor | Payment Method | Description | Amount |
| ---- | -------- | -------- | ------ | -------------- | ----------- | ------ |

- **Date** accepts `yyyy-mm-dd`, common date strings, or Excel date cells.
- **Property** is matched by name; unknown names create a new property on import.
- **Amount** ignores currency symbols and commas.

---

## Project structure

```
src/
  lib/
    storage/        cloud (Supabase) + local (browser) backends, one shared API
    constants.js    categories, payment methods, colours, currency
    format.js       currency / date formatting
    filters.js      expense filtering + totals
    stats.js        chart aggregations
    exports.js      Excel / CSV / PDF export + spreadsheet import
  context/          AuthContext, DataContext
  components/       Layout, forms, table, charts UI, primitives
  pages/            Dashboard, Properties, Expenses, Reports, Login
supabase/
  schema.sql        run this in Supabase to set up the database
```

The data layer is backend-agnostic: `src/lib/storage/index.js` picks the
Supabase backend when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set,
and otherwise falls back to the local browser backend. The rest of the app only
ever imports `db` from there.
