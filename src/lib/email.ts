import "server-only";

// Server-only transactional email via Resend. Used to send a password-reset link
// to an athlete's RECOVERY email (a different address than their login), which
// Supabase's built-in auth emails can't target. Reads RESEND_API_KEY and an
// optional BUILD_FROM_EMAIL. Returns false (never throws) when unconfigured or on
// failure, so callers can degrade gracefully without leaking why.
export async function sendRecoveryEmail(to: string, resetLink: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BUILD_FROM_EMAIL || "BUILD <onboarding@resend.dev>";
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "Reset your BUILD password",
        text:
          `Someone asked to reset the password for your BUILD account.\n\n` +
          `Tap to choose a new password:\n${resetLink}\n\n` +
          `If this wasn't you, you can ignore this email — nothing changes.`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
