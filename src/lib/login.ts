// Athletes sign in with ONE of three login kinds, all with a password and no
// external messaging provider:
//   - email     a real address           "abby@example.com"
//   - phone     a number                 → synthetic "<digits>@phone.build"
//   - username  a chosen handle          → synthetic "<handle>@username.build"
// Phone and username are encoded as synthetic emails so they ride the existing
// email+password auth and the same `athlete_email` matching for role detection /
// RLS — no backend changes. The real address (if any) is the only one that can
// receive mail; phone/username recover via a separate recovery email on file.

const PHONE_DOMAIN = "@phone.build";
const USERNAME_DOMAIN = "@username.build";

export type LoginKind = "email" | "phone" | "username";

// Canonicalize a phone to a single form so different formats resolve to the same
// login: drop a US leading "1" on 11-digit numbers ("1 555…" == "555…").
function canonicalDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return d;
}

// Canonicalize a username: lowercase, keep [a-z0-9._-]. A valid handle is ≥3
// chars and has at least one letter (so it can never collide with a phone).
export function canonicalUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function isValidUsername(input: string): boolean {
  const h = canonicalUsername(input);
  return h.length >= 3 && /[a-z]/.test(h);
}

// Does this raw input look like a phone number (only phone-ish chars, ≥7 digits)?
function looksLikePhoneInput(input: string): boolean {
  const v = input.trim();
  return /^[0-9()+\-.\s]+$/.test(v) && v.replace(/\D/g, "").length >= 7;
}

// Turn user input into the auth identifier. When `kind` is known (the coach /
// athlete picked a tab) we build that kind directly; otherwise we infer it — used
// by the sign-in screen, where the athlete just types whatever they have.
export function toLoginId(input: string, kind?: LoginKind): string {
  const v = input.trim();
  if (kind === "email") return v.toLowerCase();
  if (kind === "phone") return `${canonicalDigits(v)}${PHONE_DOMAIN}`;
  if (kind === "username") return `${canonicalUsername(v)}${USERNAME_DOMAIN}`;
  // infer (unauthenticated resolver)
  if (v.includes("@")) return v.toLowerCase();
  if (looksLikePhoneInput(v)) return `${canonicalDigits(v)}${PHONE_DOMAIN}`;
  return `${canonicalUsername(v)}${USERNAME_DOMAIN}`;
}

export function isPhoneLogin(id?: string): boolean {
  return Boolean(id && id.endsWith(PHONE_DOMAIN));
}

export function isUsernameLogin(id?: string): boolean {
  return Boolean(id && id.endsWith(USERNAME_DOMAIN));
}

export function loginKind(id?: string): LoginKind {
  if (isPhoneLogin(id)) return "phone";
  if (isUsernameLogin(id)) return "username";
  return "email";
}

export function phoneDigits(id?: string): string {
  return isPhoneLogin(id) ? id!.slice(0, -PHONE_DOMAIN.length) : "";
}

export function usernameHandle(id?: string): string {
  return isUsernameLogin(id) ? id!.slice(0, -USERNAME_DOMAIN.length) : "";
}

export function formatPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return input;
}

// Human-readable form of a login id, whatever its kind.
export function displayLogin(id?: string): string {
  if (!id) return "";
  if (isPhoneLogin(id)) return formatPhone(phoneDigits(id));
  if (isUsernameLogin(id)) return usernameHandle(id);
  return id;
}
