import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Reconcile a client row after an athlete confirms a native email change.
//
// When an athlete changes their login to a real email, Supabase updates their
// auth email only once they click the confirm link — out of band. At change time
// we stamped the target client id into admin-only `app_metadata.pending_client_id`
// (un-forgeable). On the athlete's next load we call this to set the client row's
// athlete_email to their now-current, confirmed email, so role detection matches.
// Idempotent and safe: it only ever sets the row to the caller's own email.

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Server not configured." }, { status: 500 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller, error } = await admin.auth.getUser(token);
  if (error || !caller.user) return Response.json({ error: "Session expired." }, { status: 401 });

  const pendingId = (caller.user.app_metadata as Record<string, unknown> | undefined)?.pending_client_id as
    | string
    | undefined;
  if (!pendingId) return Response.json({ ok: true, synced: false });

  const email = (caller.user.email || "").toLowerCase();
  const { data: client } = await admin
    .from("clients")
    .select("id, athlete_email")
    .eq("id", pendingId)
    .single();

  const clear = async () =>
    admin.auth.admin.updateUserById(caller.user!.id, { app_metadata: { pending_client_id: null } });

  // Already in sync, or the pending row vanished → just clear the flag.
  if (!client || (client.athlete_email as string | null)?.toLowerCase() === email) {
    await clear();
    return Response.json({ ok: true, synced: false });
  }

  // Don't clobber another athlete who already holds this email.
  const { data: dupe } = await admin
    .from("clients")
    .select("id")
    .ilike("athlete_email", email)
    .neq("id", pendingId)
    .limit(1);
  if (dupe && dupe.length) {
    await clear();
    return Response.json({ ok: false, error: "Login already in use." }, { status: 409 });
  }

  await admin.from("clients").update({ athlete_email: email }).eq("id", pendingId);
  await clear();
  return Response.json({ ok: true, synced: true });
}
