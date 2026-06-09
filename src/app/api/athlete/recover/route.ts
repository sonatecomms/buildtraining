import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendRecoveryEmail } from "@/lib/email";

// Unauthenticated password recovery for a LOCKED-OUT athlete whose login is a
// phone or username (no inbox, so Supabase's reset link has nowhere to go). We
// look up the recovery email they (or their coach) put on file and send a real
// reset link there.
//
// Security: always returns the same generic success regardless of whether the
// account or a recovery email exists, so this can't be used to probe for valid
// logins. Email-login athletes don't use this path (AuthGate sends them through
// Supabase's native resetPasswordForEmail instead).

export async function POST(req: NextRequest) {
  const ok = () => Response.json({ ok: true });
  const admin = getSupabaseAdmin();
  if (!admin) return ok();

  let loginId: string | undefined;
  try {
    loginId = (await req.json())?.loginId?.trim().toLowerCase();
  } catch {
    return ok();
  }
  if (!loginId) return ok();

  // Find the recovery email on the matching client row.
  const { data: rows } = await admin
    .from("clients")
    .select("recovery_email")
    .ilike("athlete_email", loginId)
    .limit(1);
  const recoveryEmail = (rows?.[0]?.recovery_email as string | null)?.trim();
  if (!recoveryEmail) return ok();

  // Generate a recovery link for the synthetic login and email it to the recovery
  // address ourselves (generateLink returns the link without sending).
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://buildtraining.vercel.app";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: loginId,
    options: { redirectTo: `${origin}/` },
  });
  const link = data?.properties?.action_link;
  if (!error && link) await sendRecoveryEmail(recoveryEmail, link);

  return ok();
}
