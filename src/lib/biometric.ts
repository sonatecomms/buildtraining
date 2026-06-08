// Face ID / Touch ID "app lock" via WebAuthn platform authenticator. The Supabase
// session stays signed in; this is a local biometric gate over the UI that
// re-locks on each cold launch. Per-device (state lives in localStorage), so a
// new device simply has no lock — no cross-device lockout.

const CRED_KEY = "build.lock.cred"; // base64 credential id; presence = lock enabled
const UNLOCK_KEY = "build.unlocked"; // sessionStorage flag for this app session

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(s: string) {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function bytes(src: string, max = 64) {
  const enc = new TextEncoder().encode(src);
  const out = new Uint8Array(Math.min(max, Math.max(1, enc.length)));
  out.set(enc.subarray(0, out.length));
  return out;
}
function rand(n = 32) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

// Does this device offer a built-in biometric authenticator (Face ID/Touch ID)?
export async function biometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isLockEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(localStorage.getItem(CRED_KEY));
}

export function isUnlocked(): boolean {
  return typeof window === "undefined" || sessionStorage.getItem(UNLOCK_KEY) === "1";
}

// Register a platform credential (prompts Face ID) and turn on the lock.
export async function enrollBiometric(userId: string, label: string): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: rand(),
        rp: { name: "BUILD", id: location.hostname },
        user: { id: bytes(userId), name: label, displayName: label },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    localStorage.setItem(CRED_KEY, toB64(cred.rawId));
    sessionStorage.setItem(UNLOCK_KEY, "1"); // just enrolled → already unlocked
    return true;
  } catch {
    return false;
  }
}

export function disableLock() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CRED_KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
}

// Prompt Face ID to unlock. Resolves true on success.
export async function unlock(): Promise<boolean> {
  const id = localStorage.getItem(CRED_KEY);
  if (!id) return true;
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: rand(),
        allowCredentials: [{ type: "public-key", id: fromB64(id) }],
        userVerification: "required",
        rpId: location.hostname,
        timeout: 60000,
      },
    });
    sessionStorage.setItem(UNLOCK_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
