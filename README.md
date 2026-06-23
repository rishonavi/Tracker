# Offset

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
- **Scan to auto-fill** — read a receipt's amount, tax, date, vendor and category automatically (AI vision when configured, on-device OCR otherwise).
- **Import bills from Gmail** — connect Gmail (read-only); Offset finds recent invoice/receipt emails, Gemini extracts the details, and you add them with one tap.
- **Vendor/payer autocomplete** — fields suggest names you've already used.
- **Quick actions** — one-tap *mark paid/received* and *duplicate* on any entry (a fast way to re-log recurring rent/EMI/utilities).
- **ROI & yield** — add an asset value to see gross/net rental yield and total ROI per asset.
- **Tax & year-end summary** — GST/tax paid vs collected and a per-year statement, with a year-end PDF.
- **Installable app (PWA)** — add Offset to your home screen; runs full-screen and works offline.
- **Payment reminders** *(optional)* — daily email digest of overdue/upcoming payments (see [`supabase/functions/payment-reminders`](./supabase/functions/payment-reminders/README.md)).
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

**Backup & restore** (on the **Reports** page) keeps a private JSON backup of
your data, restorable on any device. Receipts stay in Supabase. Options:

- **Backup file** — no setup: download a `.json` backup and keep it in iCloud
  Drive, Dropbox, or anywhere; restore it on any device.
- **Google Drive** — set `VITE_GOOGLE_CLIENT_ID` (enable the Drive API + an
  OAuth Web client; add your site to Authorized JavaScript origins).
- **Dropbox** — set `VITE_DROPBOX_APP_KEY` (Scoped app, App-folder access,
  files.content.read/write; add your site as an OAuth redirect URI).
- **OneDrive** — set `VITE_MS_CLIENT_ID` (Azure SPA app, implicit access tokens,
  Files.ReadWrite.AppFolder; add your site as a redirect URI).

Configured providers appear in the **Backup & restore** card; each connects in a
popup and reads/writes a private `offset-backup.json` in your own account.
(iCloud has no public web API for this — use the backup file there.)

---

## Receipt scanning (auto-fill)

When adding an expense or income, attach a bill photo/PDF and press **Scan to
auto-fill** — the amount, tax, date, vendor and (for expenses) category are read
off the receipt for you to confirm.

There are two readers, and the app picks the best one available automatically:

1. **AI vision (accurate, recommended — and free).** Create a free
   [Google AI Studio](https://aistudio.google.com) API key (just a Google
   account, no credit card) and set it as `GEMINI_API_KEY` on your host. The app
   then reads receipts with Gemini's vision model — it copes with angled photos,
   faint thermal prints, handwriting and non-English bills, and maps the spend
   onto one of your categories. The key is used only by the serverless function
   in [`api/`](./api/scan-receipt.js); it is **never** shipped to the browser
   (note there is no `VITE_` prefix). Optionally set `SCAN_MODEL` (defaults to
   `gemini-2.0-flash`).
2. **On-device OCR (free, zero setup).** With no API key, scanning falls back to
   in-browser OCR (Tesseract) plus heuristics — handy but less accurate.

> The `/api` function runs automatically on Vercel (and any host that supports
> Node serverless functions). On a purely static host it won't run, so scanning
> will use the on-device OCR fallback.

---

## Import bills from Gmail (optional)

The **Import from Gmail** page connects your Gmail (read-only), finds recent
emails with invoice/receipt attachments, reads each one with the Gemini scanner,
and shows them in a review list — pick the asset, confirm the amount/date, and
add. Everything runs in your browser with your own Google login; nothing is
stored on a server.

Setup (reuses `VITE_GOOGLE_CLIENT_ID`):

1. In [Google Cloud](https://console.cloud.google.com): **APIs & Services →
   Library** → enable the **Gmail API** (and the **Google Drive API** if you also
   want backup).
2. **OAuth consent screen** → add the scope
   `https://www.googleapis.com/auth/gmail.readonly`, and add your Google account
   as a **Test user**.
3. **Credentials → OAuth client ID (Web)** → add your site to **Authorized
   JavaScript origins** → set `VITE_GOOGLE_CLIENT_ID` in your host → redeploy.
4. Make sure `GEMINI_API_KEY` is set (the import uses the same `/api/scan-receipt`
   reader).

> `gmail.readonly` is a Google **restricted** scope. In "Testing" mode it works
> for you and any test users you add; letting the general public connect would
> require Google's restricted-scope security assessment.

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
api/
  scan-receipt.js   serverless function: reads receipts with Gemini vision
supabase/
  schema.sql        run this in Supabase to set up the database
```

The data layer is backend-agnostic: `src/lib/storage/index.js` picks the
Supabase backend when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set,
and otherwise falls back to the local browser backend. The rest of the app only
ever imports `db` from there.
