import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { UserId } from "./types";

/**
 * Thin server-side auth modeled after better-auth's API surface so we can
 * migrate to real better-auth + a database later with minimal call-site
 * churn.
 *
 * For now:
 * - Three users (Winter, Rebekah, Maarten) with credentials defined in env
 *   variables. No signups, no user table.
 * - Sessions are HMAC-signed httpOnly cookies. Stateless: no session table.
 * - All auth state lives in `AUTH_SECRET` (HMAC key) and the env var
 *   credentials.
 */

export const SESSION_COOKIE = "quest_house_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const USER_IDS: UserId[] = ["winter", "rebekah", "maarten"];

interface CredentialEntry {
  userId: UserId;
  username: string;
  password: string;
}

/** Read the three credential pairs from env vars. Skips users without one. */
export function getCredentials(): CredentialEntry[] {
  const out: CredentialEntry[] = [];
  for (const userId of USER_IDS) {
    const upper = userId.toUpperCase();
    const username =
      process.env[`${upper}_USERNAME`] ?? userId; // default username = userId
    const password = process.env[`${upper}_PASSWORD`];
    if (!password) continue;
    out.push({ userId, username, password });
  }
  return out;
}

export function getCredentialsConfigured(): boolean {
  return getCredentials().length > 0;
}

/** Find a user by username/password (constant-time-ish comparison). */
export function verifyCredentials(
  username: string,
  password: string
): UserId | null {
  const creds = getCredentials();
  let matched: UserId | null = null;
  for (const c of creds) {
    // We compare every entry to avoid leaking which usernames exist via
    // timing differences. Constant-time per entry.
    const u = safeEq(c.username, username);
    const p = safeEq(c.password, password);
    if (u && p && matched === null) {
      matched = c.userId;
    }
  }
  return matched;
}

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still do a comparison against a same-length buffer to keep timing flat.
    timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return timingSafeEqual(ba, bb);
}

// ---------- session cookie ----------

interface SessionPayload {
  uid: UserId;
  exp: number; // epoch seconds
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET env var is missing or too short (min 16 chars)"
    );
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return Buffer.from(
    s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad),
    "base64"
  );
}

export function signSession(userId: UserId): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(
    createHmac("sha256", getSecret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  let expected: string;
  try {
    expected = b64url(createHmac("sha256", getSecret()).update(body).digest());
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (!USER_IDS.includes(payload.uid)) return null;
  return payload;
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const cookie = req.cookies.get(SESSION_COOKIE);
  return verifySession(cookie?.value ?? null);
}

/** Build the Set-Cookie value for a fresh session. */
export function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function buildClearCookie(): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
