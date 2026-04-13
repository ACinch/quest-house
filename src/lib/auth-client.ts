"use client";

import { create } from "zustand";
import type { Role, UserId } from "./types";

/**
 * Client-side auth modeled loosely after better-auth's React API:
 *   - signIn({ username, password })
 *   - signOut()
 *   - useSession() → { data, isPending, error }
 *
 * If/when we migrate to real better-auth, replace the network calls below
 * with `betterAuthClient.signIn.username(...)` etc. The component-level API
 * stays the same.
 */

export interface SessionUser {
  id: UserId;
  username: string;
  /** "child" for Winter, "parent" for Rebekah/Maarten. Derived server-side. */
  role: Role;
}

/** Convenience selector — true iff the currently signed-in user is a parent. */
export function useIsParent(): boolean {
  const user = useSessionStore((s) => s.user);
  return user?.role === "parent";
}

/** Convenience selector — true iff the currently signed-in user is Winter (child). */
export function useIsChild(): boolean {
  const user = useSessionStore((s) => s.user);
  return user?.role === "child";
}

interface SessionStore {
  user: SessionUser | null;
  isPending: boolean;
  error: string | null;
  /** Whether the server has any credentials configured at all. */
  credentialsConfigured: boolean;
  /** Whether AUTH_SECRET is set on the server. */
  secretConfigured: boolean;
  /** Has the initial /me probe completed? */
  initialized: boolean;

  setUser: (user: SessionUser | null) => void;
  setPending: (p: boolean) => void;
  setError: (e: string | null) => void;
  setMeta: (m: { credentialsConfigured: boolean; secretConfigured: boolean }) => void;
  setInitialized: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  isPending: false,
  error: null,
  credentialsConfigured: false,
  secretConfigured: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setPending: (isPending) => set({ isPending }),
  setError: (error) => set({ error }),
  setMeta: ({ credentialsConfigured, secretConfigured }) =>
    set({ credentialsConfigured, secretConfigured }),
  setInitialized: () => set({ initialized: true }),
}));

/** React hook — returns the current session or null. */
export function useSession() {
  const user = useSessionStore((s) => s.user);
  const isPending = useSessionStore((s) => s.isPending);
  const error = useSessionStore((s) => s.error);
  const initialized = useSessionStore((s) => s.initialized);
  return { data: user, isPending, error, initialized };
}

interface MeResponse {
  user: SessionUser | null;
  credentialsConfigured: boolean;
  secretConfigured: boolean;
}

/** GET /api/auth/me — populates the session store from the cookie. */
export async function fetchSession(): Promise<MeResponse | null> {
  const sess = useSessionStore.getState();
  sess.setPending(true);
  sess.setError(null);
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) {
      sess.setError(`me: ${res.status}`);
      return null;
    }
    const data: MeResponse = await res.json();
    sess.setUser(data.user);
    sess.setMeta({
      credentialsConfigured: data.credentialsConfigured,
      secretConfigured: data.secretConfigured,
    });
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    sess.setError(message);
    return null;
  } finally {
    sess.setPending(false);
    sess.setInitialized();
  }
}

interface SignInArgs {
  username: string;
  password: string;
}

interface SignInResult {
  ok: boolean;
  error?: string;
  user?: SessionUser;
}

/** POST /api/auth/sign-in. Sets the cookie on success. */
export async function signIn(args: SignInArgs): Promise<SignInResult> {
  const sess = useSessionStore.getState();
  sess.setPending(true);
  sess.setError(null);
  try {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
      credentials: "same-origin",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = body.error || `Sign-in failed (${res.status})`;
      sess.setError(err);
      return { ok: false, error: err };
    }
    sess.setUser(body.user);
    return { ok: true, user: body.user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    sess.setError(message);
    return { ok: false, error: message };
  } finally {
    sess.setPending(false);
  }
}

/** POST /api/auth/sign-out. Clears the cookie. */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // ignore
  }
  useSessionStore.getState().setUser(null);
}

/** Convenience client export for ergonomic usage. */
export const authClient = {
  signIn,
  signOut,
  fetchSession,
  useSession,
};
