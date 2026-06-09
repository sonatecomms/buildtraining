import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { findUserByEmail } from "@/lib/userLookup";
import { isWellFormedLoginId } from "@/lib/login";

// Coach-initiated login + password management for an athlete.
//
// Reconciles the real auth account (rename / create / repassword) and syncs the
// client row. Authorizes the caller as the coach who owns the client. athlete_email
// is written with the coach's own token (RLS + the protect trigger accept it).

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Server not configured for logins." }, { status: 500 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller.user) return Response.json({ error: "Your session expired — sign in again." }, { status: 401 });

  let body: { clientId?: string; newPassword?: string; loginId?: string; previousLoginId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const { clientId, newPassword } = body;
  if (!clientId || !newPassword || newPassword.length < 6)
    return Response.json({ error: "A client and a 6+ character password are required." }, { status: 400 });

  // Authorize: caller must be the coach who owns this client.
  const { data: client } = await admin
    .from("clients")
    .select("id, athlete_email, coach_id")
    .eq("id", clientId)
    .single();
  if (!client) return Response.json({ error: "Athlete not found." }, { status: 404 });
  if (client.coach_id !== caller.user.id) return Response.json({ error: "That athlete isn't on your roster." }, { status: 403 });

  const storedEmail = (client.athlete_email as string | null)?.toLowerCase() || "";
  const desired = (body.loginId || storedEmail).trim().toLowerCase();
  if (!desired) return Response.json({ error: "Add this athlete's email or phone first." }, { status: 400 });
  if (!isWellFormedLoginId(desired))
    return Response.json({ error: "That login isn't valid. Check the email, phone, or username." }, { status: 400 });

  // Another athlete already using this login id?
  if (desired !== storedEmail) {
    const { data: dupe } = await admin.from("clients").select("id").ilike("athlete_email", desired).neq("id", clientId).limit(1);
    if (dupe && dupe.length) return Response.json({ error: "Another athlete already uses that email/phone." }, { status: 409 });
  }

  // Resolve the athlete's auth account (by desired, the previous id, or the stored id).
  const atDesired = await findUserByEmail(admin, desired);
  const previous = body.previousLoginId?.trim().toLowerCase();
  const renameTarget =
    (previous && previous !== desired ? await findUserByEmail(admin, previous) : null) ||
    (storedEmail && storedEmail !== desired ? await findUserByEmail(admin, storedEmail) : null);

  if (atDesired && renameTarget && atDesired.id !== renameTarget.id)
    return Response.json({ error: "Another account already uses that email/phone. Pick a different one." }, { status: 409 });

  const found = atDesired || renameTarget;
  if (found) {
    const attrs: { password: string; email_confirm: true; email?: string } = { password: newPassword, email_confirm: true };
    if ((found.email || "").toLowerCase() !== desired) attrs.email = desired;
    const { error: updErr } = await admin.auth.admin.updateUserById(found.id, attrs);
    if (updErr) return Response.json({ error: "Couldn't update the athlete's account — try again." }, { status: 500 });
  } else {
    const { error: createErr } = await admin.auth.admin.createUser({
      email: desired,
      password: newPassword,
      email_confirm: true,
      user_metadata: { intent: "athlete", password_set: true },
    });
    if (createErr) return Response.json({ error: "Couldn't create the athlete's account — try again." }, { status: 500 });
  }

  // Sync the client row's login id (coach token; the protect trigger accepts it).
  if (desired !== storedEmail) {
    const asCoach = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { error: syncErr } = await asCoach.from("clients").update({ athlete_email: desired }).eq("id", clientId);
    if (syncErr)
      return Response.json({ error: "Saved their password, but couldn't link the new login — try again." }, { status: 500 });
  }

  return Response.json({ ok: true, loginId: desired });
}
