import type { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { findUserByEmail } from "@/lib/userLookup";
import { isWellFormedLoginId, loginKind } from "@/lib/login";

// Athlete-initiated change of their OWN login id (email / phone / username).
//
// The athlete is signed in and re-enters their current password (re-auth). Then:
//   - phone / username  → applied immediately; the auth email and client row are
//     updated, with rollback of the auth email if the row write fails so the two
//     never drift apart.
//   - real email        → Supabase's native email-change confirmation (link to the
//     new address); the client row is reconciled only after they confirm, via
//     /api/athlete/sync-login (target stamped in admin-only app_metadata).

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
  if (!desired || !isWellFormedLoginId(desired))
    return Response.json({ error: "That login isn't valid. Check the email, phone, or username." }, { status: 400 });
  if (!currentPassword) return Response.json({ error: "Enter your current password." }, { status: 400 });

  const currentEmail = (caller.user.email || "").toLowerCase();
  if (desired === currentEmail) return Response.json({ error: "That's already your login." }, { status: 400 });

  // Re-auth: verify the current password with a throwaway sign-in, then discard it.
  const anon = makeAnon();
  const { data: reauth, error: reauthErr } = await anon.auth.signInWithPassword({ email: currentEmail, password: currentPassword });
  if (reauthErr || !reauth.session) return Response.json({ error: "That password isn't right." }, { status: 401 });
  await anon.auth.signOut().catch(() => {});

  // Confirm the caller is actually an athlete with a client row.
  const { data: mine } = await admin
    .from("clients")
    .select("id")
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
  if (dupeRow && dupeRow.length) return Response.json({ error: "That login is taken. Try another." }, { status: 409 });
  const other = await findUserByEmail(admin, desired);
  if (other && other.id !== caller.user.id) return Response.json({ error: "That login is taken. Try another." }, { status: 409 });

  if (loginKind(desired) === "email") {
    // Native email-change confirmation; reconcile the row only after they confirm.
    const asAthlete = makeAnon(token);
    const { error: updErr } = await asAthlete.auth.updateUser({ email: desired });
    if (updErr) return Response.json({ error: "Couldn't start the email change — try again." }, { status: 400 });
    await admin.auth.admin.updateUserById(caller.user.id, { app_metadata: { pending_client_id: client.id } });
    return Response.json({ ok: true, pending: true });
  }

  // phone / username — apply now, with rollback if the row write fails.
  const { error: authErr } = await admin.auth.admin.updateUserById(caller.user.id, { email: desired, email_confirm: true });
  if (authErr) return Response.json({ error: "Couldn't update your login — try again." }, { status: 500 });
  const { error: rowErr } = await admin.from("clients").update({ athlete_email: desired }).eq("id", client.id);
  if (rowErr) {
    // compensate: put the auth account back so login + record stay consistent
    await admin.auth.admin.updateUserById(caller.user.id, { email: currentEmail, email_confirm: true }).catch(() => {});
    return Response.json({ error: "Couldn't update your login — try again." }, { status: 500 });
  }
  return Response.json({ ok: true, loginId: desired });
}

function makeAnon(bearer?: string): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(bearer ? { global: { headers: { Authorization: `Bearer ${bearer}` } } } : {}),
  });
}
