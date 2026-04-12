"use client";

import { useEffect, useState } from "react";
import { fetchSession, signIn, useSession, useSessionStore } from "@/lib/auth-client";
import { initSync } from "@/lib/sync";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { data: user, initialized } = useSession();
  const credentialsConfigured = useSessionStore((s) => s.credentialsConfigured);
  const secretConfigured = useSessionStore((s) => s.secretConfigured);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Probe the server once on mount to learn the session state.
  useEffect(() => {
    void fetchSession();
  }, []);

  // Once we know there's a logged-in user, kick off sync.
  useEffect(() => {
    if (user) void initSync();
  }, [user]);

  // Splash while we wait for the first /me probe.
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-[10px] text-yellow-300">LOADING…</div>
      </div>
    );
  }

  // If logged in, render the app.
  if (user) {
    return <>{children}</>;
  }

  // Server hasn't been configured for auth at all.
  if (!credentialsConfigured || !secretConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panel max-w-sm w-full space-y-3">
          <div className="h2 text-center">⚠️ AUTH NOT CONFIGURED</div>
          <p className="text-sm muted">
            The server doesn't have credentials set up yet. Add the following
            environment variables in Vercel and redeploy:
          </p>
          <pre className="text-xs panel panel-tight overflow-x-auto">
{`AUTH_SECRET=<32+ char random string>
WINTER_PASSWORD=<password>
REBEKAH_PASSWORD=<password>
MAARTEN_PASSWORD=<password>
# Optional — defaults to the lowercased name:
# WINTER_USERNAME=winter
# REBEKAH_USERNAME=rebekah
# MAARTEN_USERNAME=maarten`}
          </pre>
          <p className="text-xs muted">
            See the README for details. Until then, the app cannot run.
          </p>
        </div>
      </div>
    );
  }

  // Login form.
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel max-w-sm w-full space-y-3">
        <div className="text-center">
          <div className="text-4xl">🧱</div>
          <div className="h1 mt-1">QUEST HOUSE</div>
          <div className="font-pixel text-[8px] text-yellow-100 mt-1">
            Sign in to continue
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!username.trim() || !password) return;
            setSubmitting(true);
            setError(null);
            const res = await signIn({
              username: username.trim(),
              password,
            });
            setSubmitting(false);
            if (!res.ok) {
              setError(res.error ?? "Sign-in failed");
              setPassword("");
            }
          }}
          className="space-y-2"
        >
          <label className="block text-sm">
            Username
            <input
              className="input mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="text-sm text-redstone">{error}</div>}
          <button
            type="submit"
            className="block-btn w-full"
            disabled={submitting || !username.trim() || !password}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-xs muted text-center">
          Three accounts: Winter, Rebekah, Maarten. Credentials come from your
          Vercel environment variables.
        </p>
      </div>
    </div>
  );
}
