import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Coach-initiated password reset for an athlete.
//
// Phone athletes sign in with a synthetic `<digits>@phone.build` address that has
// no real inbox, so Supabase's "email a reset link" flow can never reach them.
// Instead the coach sets a new password here and relays it. This runs server-side
// with the service-role key so that privileged key never touches the browser, and
// we authorize every call: the caller must be the signed-in coach who owns the
// target client.

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Server not configured for password resets." }, { status: 500 });

  // 1) Authenticate the caller from their bearer token (the coach's session).
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller.user) return Response.json({ error: "Your session expired — sign in again." }, { status: 401 });

  // 2) Read and validate inputs.
  let body: { clientId?: string; newPassword?: string };
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
  if (!client.athlete_email)
    return Response.json({ error: "Add this athlete's email or phone first, then reset." }, { status: 400 });

  // 4) Find the athlete's auth user by their login id (no get-by-email in the
  //    admin API, so page through), then set the new password.
  const email = (client.athlete_email as string).toLowerCase();
  let target: { id: string } | null = null;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return Response.json({ error: "Couldn't look up the athlete's account." }, { status: 500 });
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) {
      target = { id: hit.id };
      break;
    }
    if (data.users.length < 200) break;
  }
  if (!target)
    return Response.json(
      { error: "No account exists yet — have them tap “Create one” on the invite link first." },
      { status: 404 },
    );

  const { error: updErr } = await admin.auth.admin.updateUserById(target.id, {
    password: newPassword,
    email_confirm: true,
  });
  if (updErr) return Response.json({ error: updErr.message }, { status: 500 });

  return Response.json({ ok: true });
}
