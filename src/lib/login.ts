// Athletes can sign in with an email OR a phone number, both with a password and
// no SMS provider. A phone login is encoded as a synthetic email
// (`<digits>@phone.build`) so it rides the existing email+password auth and the
// same `athlete_email` matching for role detection / RLS — no backend changes.

const PHONE_DOMAIN = "@phone.build";

// Turn whatever the user typed (email or phone) into the auth identifier.
export function toLoginId(input: string): string {
  const v = input.trim();
  if (v.includes("@")) return v.toLowerCase();
  const digits = v.replace(/\D/g, "");
  return `${digits}${PHONE_DOMAIN}`;
}

export function isPhoneLogin(id?: string): boolean {
  return Boolean(id && id.endsWith(PHONE_DOMAIN));
}

export function phoneDigits(id?: string): string {
  return isPhoneLogin(id) ? id!.slice(0, -PHONE_DOMAIN.length) : "";
}

export function formatPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return input;
}
