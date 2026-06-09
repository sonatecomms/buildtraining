import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendRecoveryEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Unauthenticated password recovery for a LOCKED-OUT athlete whose login is a
// phone/username (no inbox). Looks up the recovery_email on the matching client
// row and emails a reset link there.
//
// Hardening:
//  - Always returns the same generic success (no account/recovery-email oracle).
//  - The email send is fire-and-forget so response time doesn't reveal whether a
//    recovery email exists.
//  - redirectTo is a fixed server constant (NOT the attacker-controllable Origin).
//  - Rate limited per-IP and per-login to blunt mail-bombing / quota abuse.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://buildtraining.vercel.app";

export async function POST(req: NextRequest) {
  const ok = () => Response.json({ ok: true });
  const admin = getSupabaseAdmin();
  if (!admin) return ok();

  if (!rateLimit(`recover:ip:${clientIp(req)}`, 5, 60 * 60 * 1000)) return ok();

  let loginId: string | undefined;
  try {
    loginId = (await req.json())?.loginId?.trim().toLowerCase();
  } catch {
    return ok();
  }
  if (!loginId) return ok();
  if (!rateLimit(`recover:login:${loginId}`, 1, 15 * 60 * 1000)) return ok();

  const { data: rows } = await admin
    .from("clients")
    .select("recovery_email")
    .ilike("athlete_email", loginId)
    .limit(1);
  const recoveryEmail = (rows?.[0]?.recovery_email as string | null)?.trim();
  if (!recoveryEmail) return ok();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: loginId,
    options: { redirectTo: `${SITE}/` },
  });
  const link = data?.properties?.action_link;
  // fire-and-forget: don't await, so timing doesn't leak that a recovery email exists
  if (!error && link) void sendRecoveryEmail(recoveryEmail, link);

  return ok();
}
