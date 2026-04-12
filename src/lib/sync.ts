"use client";

import { create } from "zustand";
import type { AppState } from "./types";
import { useStore } from "./store";

const DEBOUNCE_MS = 1500;

export type SyncStatus =
  | "idle"
  | "loading"
  | "synced"
  | "syncing"
  | "error"
  | "offline"
  | "unauthorized"
  | "needs-config";

interface SyncStoreShape {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;

  setStatus: (s: SyncStatus, error?: string | null) => void;
  setLastSyncedAt: (ts: string) => void;
}

export const useSyncStore = create<SyncStoreShape>((set) => ({
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));

// ---------- network ----------

interface FetchOpts {
  signal?: AbortSignal;
}

async function apiGet(opts: FetchOpts = {}): Promise<{
  status: number;
  body: { state?: AppState | null; error?: string };
}> {
  const res = await fetch("/api/state", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    signal: opts.signal,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function apiPut(state: AppState, opts: FetchOpts = {}): Promise<{
  status: number;
  body: { ok?: boolean; error?: string; savedAt?: string };
}> {
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
    credentials: "same-origin",
    signal: opts.signal,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// ---------- sync engine ----------

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let initialized = false;
let suspendPushOnce = false;

/**
 * Initialize the sync engine. Called from LoginGate after the user is
 * authenticated.
 */
export async function initSync() {
  if (initialized) return;
  initialized = true;

  await hydrateFromServer();
  subscribeToStoreChanges();
}

/** GET state from server. If present, replace local. If empty, push local up. */
export async function hydrateFromServer(): Promise<boolean> {
  const sync = useSyncStore.getState();
  sync.setStatus("loading");
  try {
    const { status, body } = await apiGet();
    if (status === 401) {
      sync.setStatus("unauthorized", "Not signed in");
      return false;
    }
    if (status === 503) {
      sync.setStatus("needs-config", body.error || "Storage not configured");
      return false;
    }
    if (status >= 400) {
      sync.setStatus("error", body.error || `Server error ${status}`);
      return false;
    }
    if (body.state) {
      // Server has state — replace local copy. We import via the store
      // action (which clears any pending chest, etc.) but we don't trigger
      // a push back to the server.
      suspendPushOnce = true;
      useStore.getState().importState(body.state);
    } else {
      // Server is empty — push local up to seed it.
      await pushNow();
    }
    sync.setStatus("synced");
    sync.setLastSyncedAt(new Date().toISOString());
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sync.setStatus("offline", message);
    return false;
  }
}

/** Force an immediate push of the current local state. */
export async function pushNow(): Promise<boolean> {
  const sync = useSyncStore.getState();
  if (sync.status === "needs-config" || sync.status === "unauthorized") return false;
  sync.setStatus("syncing");
  try {
    const state = useStore.getState().state;
    const { status, body } = await apiPut(state);
    if (status === 401) {
      sync.setStatus("unauthorized", "Not signed in");
      return false;
    }
    if (status === 503) {
      sync.setStatus("needs-config", body.error || "Storage not configured");
      return false;
    }
    if (status >= 400) {
      sync.setStatus("error", body.error || `Server error ${status}`);
      return false;
    }
    sync.setStatus("synced");
    sync.setLastSyncedAt(body.savedAt || new Date().toISOString());
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sync.setStatus("offline", message);
    return false;
  }
}

function subscribeToStoreChanges() {
  if (unsubscribeStore) return;
  unsubscribeStore = useStore.subscribe((curr, prev) => {
    if (curr.state === prev.state) return;
    if (suspendPushOnce) {
      suspendPushOnce = false;
      return;
    }
    schedulePush();
  });
}

function schedulePush() {
  const sync = useSyncStore.getState();
  if (sync.status === "needs-config" || sync.status === "unauthorized") return;
  sync.setStatus("syncing");
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, DEBOUNCE_MS);
}

/** Manual sync — used by the indicator and Settings page. */
export async function manualSync(): Promise<boolean> {
  return await hydrateFromServer();
}

/** Reset the engine state — used after sign-out. */
export function resetSync() {
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  initialized = false;
  suspendPushOnce = false;
  useSyncStore.getState().setStatus("idle");
}
