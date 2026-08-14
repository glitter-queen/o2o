# EA Command Center

Your task command center, now backed by a real Postgres database (Supabase) so nothing is ever lost.

Stack: **Vite + React** (frontend) · **Supabase** (database) · **Vercel** (hosting).

---

## What you'll do (about 15 minutes)

1. Create a Supabase project + table
2. Test it locally (optional but nice)
3. Push to GitHub
4. Deploy on Vercel
5. Restore your old data (if you have a backup file)

---

## 1. Supabase — create the database

1. Go to https://supabase.com → **New project**. Give it a name, set a database password (save it), pick a region close to you.
2. When it's ready, open the **SQL Editor** (left sidebar) → **New query**.
3. Open the file `supabase/schema.sql` from this project, copy all of it, paste it in, and click **Run**. You should see "Success."
4. Go to **Project Settings → API**. Copy two values — you'll need them in the next steps:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

---

## 2. Run it locally (optional)

You need Node.js 18+ installed (https://nodejs.org).

```bash
npm install
cp .env.example .env
```

Open `.env` and paste your two values:

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then:

```bash
npm run dev
```

Open the URL it prints (usually http://localhost:5173). The board should load and the header should say **"Saved to cloud."** Make an edit, refresh — it persists. 🎉

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "EA Command Center"
```

Create a new **empty** repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/ea-command-center.git
git branch -M main
git push -u origin main
```

> `.env` is gitignored, so your keys are NOT pushed. You'll add them in Vercel next.

---

## 4. Deploy on Vercel

1. Go to https://vercel.com → **Add New… → Project** → import your GitHub repo.
2. Vercel auto-detects Vite. Before deploying, expand **Environment Variables** and add BOTH:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
3. Click **Deploy**. In ~1 minute you'll get a live URL. That's your app. Bookmark it.

> If you add the env vars *after* the first deploy, go to **Settings → Environment Variables**, add them, then **Redeploy**.

---

## 5. Restore your old data (if you have a backup)

If you ever clicked **Backup** in the old app, you downloaded a `ea-command-center-backup.json` file.

- Open your live app → click the **Restore** (upload) button in the top-right → choose that file.
- Your entire board loads in and saves straight to Supabase.

No backup? No problem — the app comes pre-seeded with all of Nick's tasks (including the ones already researched), so you're starting from a full board, not zero.

---

## Keeping your data safe from now on

- **It auto-saves to Supabase** on every change (watch the "Saving… / Saved to cloud" indicator in the header).
- The **Backup** button still works as an extra belt-and-suspenders export whenever you want a local copy.

---

## A note on security

The quick-start setup lets the app's public key read/write the board — great for launching fast, fine for a private internal tool. If you want it locked to just you, open `supabase/schema.sql` and follow the **AUTH** section at the bottom, then ask Claude to add a sign-in screen. Takes a few minutes.

---

## Editing the app later

Everything lives in `src/App.jsx`. Push a change to GitHub and Vercel redeploys automatically.
