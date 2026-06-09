import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Coach-initiated login + password management for an athlete.
//
// Phone athletes sign in with a synthetic `<digits>@phone.build` address that has
// no real inbox, so Supabase's "email a reset link" flow can never reach them.
// And the coach's athlete login field only ever updated the client row, never the
// auth account — so the two could drift apart (an athlete left unable to sign in).
//
// This single endpoint reconciles both: given the desired login id (`loginId`) and
// a new password, it finds the athlete's auth user (by the new id, the previous id,
// or the id stored on the client), then renames + repasswords it — or creates the
// account if none exists yet — and writes the login id back onto the client row so
// role detection always matches. Runs server-side with the service-role key, and
// authorizes every call: the caller must be the signed-in coach who owns the client.

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Server not configured for logins." }, { status: 500 });

  // 1) Authenticate the caller from their bearer token (the coach's session).
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller.user) return Response.json({ error: "Your session expired — sign in again." }, { status: 401 });

  // 2) Read and validate inputs.
  let body: { clientId?: string; newPassword?: string; loginId?: string; previousLoginId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const { clientId, newPassword } = body;
  if (!clientId || !newPassword || newPassword.length < 6)
    return Response.json({ error: "A client and a 6+ character password are required." }, { status: 400 });

  // 3) Authorize: the caller must be the coach who owns this client.
  const { data: client } = await admin
    .from("clients")
    .select("id, athlete_email, coach_id")
    .eq("id", clientId)
    .single();
  if (!client) return Response.json({ error: "Athlete not found." }, { status: 404 });
  if (client.coach_id !== caller.user.id)
    return Response.json({ error: "That athlete isn't on your roster." }, { status: 403 });

  // The login id the coach wants this athlete to use (falls back to the stored one
  // for a plain password reset). Already canonicalized client-side via toLoginId.
  const storedEmail = (client.athlete_email as string | null)?.toLowerCase() || "";
  const desired = (body.loginId || storedEmail).trim().toLowerCase();
  if (!desired) return Response.json({ error: "Add this athlete's email or phone first." }, { status: 400 });

  // If the login id is changing, make sure no OTHER athlete already uses it (the DB
  // has a unique index on it too, but check first for a clean error + no partial work).
  if (desired !== storedEmail) {
    const { data: dupe } = await admin
      .from("clients")
      .select("id")
      .ilike("athlete_email", desired)
      .neq("id", clientId)
      .limit(1);
    if (dupe && dupe.length)
      return Response.json({ error: "Another athlete already uses that email/phone." }, { status: 409 });
  }

  // 4) Find the athlete's existing auth user. Try the new id, the previous id the
  //    coach was editing from, and whatever is on the client row — so a username
  //    change still lands on the same account instead of orphaning it.
  const wanted = new Set(
    [desired, body.previousLoginId, storedEmail].filter(Boolean).map((e) => e!.toLowerCase()),
  );
  let found: { id: string; email: string } | null = null;
  let occupiedByOther = false; // a *different* account already sits at `desired`
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return Response.json({ error: "Couldn't look up the athlete's account." }, { status: 500 });
    for (const u of data.users) {
      const e = (u.email || "").toLowerCase();
      if (!found && wanted.has(e)) found = { id: u.id, email: e };
      if (e === desired && (!found || found.email !== desired)) occupiedByOther = true;
    }
    if (data.users.length < 200) break;
  }

  if (found && found.email !== desired && occupiedByOther)
    return Response.json(
      { error: "Another account already uses that email/phone. Pick a different one." },
      { status: 409 },
    );

  if (found) {
    const attrs: { password: string; email_confirm: true; email?: string } = {
      password: newPassword,
      email_confirm: true,
    };
    if (found.email !== desired) attrs.email = desired;
    const { error: updErr } = await admin.auth.admin.updateUserById(found.id, attrs);
    if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
  } else {
    const { error: createErr } = await admin.auth.admin.createUser({
      email: desired,
      password: newPassword,
      email_confirm: true,
      user_metadata: { intent: "athlete", password_set: true },
    });
    if (createErr) return Response.json({ error: createErr.message }, { status: 500 });
  }

  // 5) Keep the client row's login id in sync so role detection matches. A
  //    service-role write here would be reverted by the build_protect_client_cols
  //    trigger (it only trusts the owning coach's uid), so write this column with
  //    the coach's own token instead — RLS + the trigger both accept it.
  if (desired !== storedEmail) {
    const asCoach = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { error: syncErr } = await asCoach.from("clients").update({ athlete_email: desired }).eq("id", clientId);
    if (syncErr)
      return Response.json({ error: "Saved their password, but couldn't link the new login — try again." }, { status: 500 });
  }

  return Response.json({ ok: true, loginId: desired });
}
