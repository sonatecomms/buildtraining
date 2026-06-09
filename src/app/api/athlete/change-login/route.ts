import type { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Athlete-initiated change of their OWN login id (email / phone / username).
//
// The athlete is signed in and re-enters their current password (re-auth). Then:
//   - phone / username  → applied immediately (no inbox to verify): we update the
//     auth account email and the client row's athlete_email.
//   - real email        → we kick off Supabase's native email-change confirmation
//     (a link goes to the new address); the client row is reconciled only once
//     they confirm, via /api/athlete/sync-login. We stamp the target client id in
//     admin-only app_metadata so that reconcile can't be forged.
//
// athlete_email writes go through the service-role client: the "athlete updates
// own client" RLS policy ties that column to the caller's JWT email (which would
// reject the new value), and the build_protect_client_cols trigger allows
// service-role (uid null) writes once relaxed.

function loginKindOf(id: string): "email" | "phone" | "username" {
  if (id.endsWith("@phone.build")) return "phone";
  if (id.endsWith("@username.build")) return "username";
  return "email";
}

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Server not configured." }, { status: 500 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller.user) return Response.json({ error: "Your session expired — sign in again." }, { status: 401 });

  let body: { newLoginId?: string; currentPassword?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const desired = body.newLoginId?.trim().toLowerCase();
  const currentPassword = body.currentPassword || "";
  if (!desired) return Response.json({ error: "Enter a new login." }, { status: 400 });
  if (!currentPassword) return Response.json({ error: "Enter your current password." }, { status: 400 });

  const currentEmail = (caller.user.email || "").toLowerCase();
  if (desired === currentEmail) return Response.json({ error: "That's already your login." }, { status: 400 });

  // Re-auth: verify the current password with a throwaway anon sign-in.
  const anon = makeAnon();
  const { data: reauth } = await anon.auth.signInWithPassword({ email: currentEmail, password: currentPassword });
  if (!reauth.session) return Response.json({ error: "That password isn't right." }, { status: 401 });

  // Confirm the caller is actually an athlete with a client row.
  const { data: mine } = await admin
    .from("clients")
    .select("id, coach_id")
    .ilike("athlete_email", currentEmail)
    .limit(1);
  const client = mine?.[0];
  if (!client) return Response.json({ error: "No athlete record found for your login." }, { status: 403 });

  // Collisions: another athlete's client row, or another auth account.
  const { data: dupeRow } = await admin
    .from("clients")
    .select("id")
    .ilike("athlete_email", desired)
    .neq("id", client.id)
    .limit(1);
  if (dupeRow && dupeRow.length)
    return Response.json({ error: "That login is taken. Try another." }, { status: 409 });
  if (await emailTaken(admin, desired, caller.user.id))
    return Response.json({ error: "That login is taken. Try another." }, { status: 409 });

  const kind = loginKindOf(desired);

  if (kind === "email") {
    // Native email-change confirmation. Apply to the client row only after confirm.
    const asAthlete = makeAnon(token);
    const { error: updErr } = await asAthlete.auth.updateUser({ email: desired });
    if (updErr) return Response.json({ error: updErr.message }, { status: 400 });
    await admin.auth.admin.updateUserById(caller.user.id, { app_metadata: { pending_client_id: client.id } });
    return Response.json({ ok: true, pending: true });
  }

  // phone / username — apply now.
  const { error: authErr } = await admin.auth.admin.updateUserById(caller.user.id, {
    email: desired,
    email_confirm: true,
  });
  if (authErr) return Response.json({ error: authErr.message }, { status: 500 });
  const { error: rowErr } = await admin.from("clients").update({ athlete_email: desired }).eq("id", client.id);
  if (rowErr) return Response.json({ error: "Updated your password but not the login — try again." }, { status: 500 });
  return Response.json({ ok: true, loginId: desired });
}

// --- helpers ---------------------------------------------------------------

function makeAnon(bearer?: string): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(bearer ? { global: { headers: { Authorization: `Bearer ${bearer}` } } } : {}),
  });
}

async function emailTaken(admin: SupabaseClient, email: string, exceptId: string): Promise<boolean> {
  for (let page = 1; page <= 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (data.users.find((u) => (u.email || "").toLowerCase() === email && u.id !== exceptId)) return true;
    if (data.users.length < 200) break;
  }
  return false;
}
