import { put, list, del } from "@vercel/blob";
import type { AppState } from "./types";

/**
 * Vercel Blob-backed storage for the household state JSON document.
 *
 * Strategy:
 * - We keep a single blob with a fixed pathname (`household-state.json`).
 * - Writes use `addRandomSuffix: false` + `allowOverwrite: true` so the URL
 *   stays stable for the same pathname.
 * - Reads use `list({ prefix })` to find the current blob URL, then `fetch`
 *   it directly. The blob is `public` so the fetch needs no auth — but the
 *   client never sees the URL: only the server (this module, called from a
 *   route handler) ever touches it.
 *
 * Required env var (set by the Vercel Blob integration automatically):
 *   BLOB_READ_WRITE_TOKEN
 */

const BLOB_PATHNAME = "household-state.json";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readState(): Promise<AppState | null> {
  if (!isBlobConfigured()) return null;

  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  if (blobs.length === 0) return null;

  // Cache-bust so we always see the latest write. Blob URLs are immutable per
  // pathname when overwrite is used, but the CDN may still serve stale copies.
  const url = `${blobs[0].url}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Blob fetch failed: ${res.status}`);
  }
  return (await res.json()) as AppState;
}

export async function writeState(state: AppState): Promise<{ url: string }> {
  if (!isBlobConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const blob = await put(BLOB_PATHNAME, JSON.stringify(state), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
  return { url: blob.url };
}

export async function deleteState(): Promise<void> {
  if (!isBlobConfigured()) return;
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  for (const b of blobs) {
    await del(b.url);
  }
}
