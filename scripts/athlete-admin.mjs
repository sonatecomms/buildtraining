// Athlete account admin for BUILD (coach use only).
//
// Diagnose and fix athlete logins from the terminal. Phone athletes sign in with
// a synthetic email `<10-digits>@phone.build`, and they can't self-reset their
// password (no real inbox), so the coach does it here.
//
// SECURITY: needs the Supabase service-role (secret) key. Never commit it; pass
// it at runtime as an env var so it never lands on disk:
//
//   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx node scripts/athlete-admin.mjs lookup "(555) 123-4567"
//   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx node scripts/athlete-admin.mjs reset  "(555) 123-4567" "newpass123"
//
// Commands:
//   lookup <phone-or-email>            -> shows the auth user + matching client row
//   reset  <phone-or-email> <newpass>  -> sets a new password (auto-confirms)
//   create <phone-or-email> <pass>     -> creates a confirmed auth user (if missing)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qypsilkeniqqgxlbwazo.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Get it from Supabase → Settings → API → service_role.");
  process.exit(1);
}

// Mirror src/lib/login.ts so the id matches what the app signs in with.
const PHONE_DOMAIN = "@phone.build";
function toLoginId(input) {
  const v = String(input).trim();
  if (v.includes("@")) return v.toLowerCase();
  let d = v.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return `${d}${PHONE_DOMAIN}`;
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// auth.admin has no get-by-email, so page through users to find a match.
async function findUser(email) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function findClient(email) {
  const { data } = await sb.from("clients").select("id,name,athlete_email,coach_id").ilike("athlete_email", email);
  return data || [];
}

const [cmd, rawId, extra] = process.argv.slice(2);
if (!cmd || !rawId) {
  console.error('Usage: <lookup|reset|create> "<phone-or-email>" [newpassword]');
  process.exit(1);
}
const id = toLoginId(rawId);

async function report() {
  const user = await findUser(id);
  const clients = await findClient(id);
  console.log(`\nLogin id (what the app uses): ${id}`);
  console.log(user ? `Auth user:   FOUND  (id ${user.id}, confirmed: ${Boolean(user.email_confirmed_at)})`
                   : `Auth user:   MISSING — no account with this exact id. She may have been created under a different number, or in the phone field instead of email.`);
  if (clients.length === 0) {
    console.log(`Client row:  MISSING — no athlete_email matches. Set her phone on her client card in the app so role detection links her.`);
  } else {
    for (const c of clients) console.log(`Client row:  FOUND  (${c.name}, athlete_email=${c.athlete_email})`);
  }
  if (user && clients.length === 0) console.log(`\n=> She can sign in, but will land on the empty "ask your coach" screen until a client row's phone matches ${id}.`);
  if (!user && clients.length > 0) console.log(`\n=> Her client card is set, but no login exists. Run: create "${rawId}" "<password>"`);
  if (!user && clients.length === 0) console.log(`\n=> Nothing matches this number. Double-check the exact digits she types.`);
  if (user && clients.length > 0) console.log(`\n=> Both exist and match. If her password fails, just reset it: reset "${rawId}" "<newpassword>"`);
  return user;
}

if (cmd === "lookup") {
  await report();
} else if (cmd === "reset") {
  if (!extra) { console.error("Provide a new password (min 6 chars)."); process.exit(1); }
  const user = await report();
  if (!user) { console.error("\nCan't reset — no auth user. Use the create command instead."); process.exit(1); }
  const { error } = await sb.auth.admin.updateUserById(user.id, { password: extra, email_confirm: true });
  if (error) { console.error("Reset failed:", error.message); process.exit(1); }
  console.log(`\n✅ Password reset. Tell her to sign in with her phone and: ${extra}`);
} else if (cmd === "create") {
  if (!extra) { console.error("Provide a password (min 6 chars)."); process.exit(1); }
  const existing = await findUser(id);
  if (existing) { console.error(`\nUser already exists (${id}). Use reset instead.`); process.exit(1); }
  const { data, error } = await sb.auth.admin.createUser({
    email: id, password: extra, email_confirm: true, user_metadata: { intent: "athlete", password_set: true },
  });
  if (error) { console.error("Create failed:", error.message); process.exit(1); }
  console.log(`\n✅ Created athlete login ${id} (id ${data.user.id}). Make sure her client card's phone matches, then give her: ${extra}`);
} else {
  console.error(`Unknown command "${cmd}". Use lookup | reset | create.`);
  process.exit(1);
}
