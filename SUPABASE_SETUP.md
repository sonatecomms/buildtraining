# Connecting Supabase (cloud sync + coach login)

The app runs fully on local storage until you do this. Once connected, your data
persists in the cloud and the app requires a magic-link sign in. Takes ~5 minutes.

## 1. Create the project
1. Go to **https://supabase.com** → sign in → **New project**.
2. Name it (e.g. `forge`), set a database password, pick a region near you, **Create**.
3. Wait ~2 minutes for it to provision.

## 2. Run the schema
1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this repo, copy all of it, paste, click **Run**.
3. New query again → paste all of `supabase/athlete_access.sql` → **Run**. This adds
   the athlete login column + the row-level rules that let athletes see only their
   own training.
4. You should see "Success. No rows returned." for both.

> Your project is already connected (URL + publishable key are in `.env.local`), but
> these tables do **not exist yet** — run both files before signing in, or the first
> sign-in can't persist anything.

## 3. Grab your keys
1. Go to **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** and the **anon / public** API key.

## 4. Add the keys to the app
1. In the project folder, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and paste your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
   ```

## 5. Allow the sign-in redirect
1. In Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to `http://localhost:3000`.
3. Under **Redirect URLs**, add `http://localhost:3000` (and your deploy URL later,
   e.g. `https://forge.vercel.app`).
4. Email magic links are enabled by default — nothing else to toggle.

## 6. Restart and sign in
```bash
npm run dev
```
- Open the app. You'll now see a **Coach sign in** screen.
- Enter your email → **Send magic link** → open the email → click the link.
- You land back signed in. Your account is seeded with the demo athlete, and every
  change now syncs to Supabase. Check the **Install** tab to confirm "Supabase
  connected" and to sign out.

### Notes
- Magic-link emails on the free tier use Supabase's shared mailer (rate-limited but
  fine for testing). For production, add an SMTP provider under Authentication →
  Emails.
- Avatars currently sync as data URLs inside the `clients` row. If you later want a
  dedicated bucket, create a public Storage bucket named `avatars` and switch the
  upload in `ProfileEditor.tsx` to upload there.
- Want a separate **athlete** login (clients open straight into their Train view)?
  That's the natural next step once this coach flow is verified.
