import { NextRequest, NextResponse } from "next/server";
import { isBlobConfigured, readState, writeState } from "@/lib/blob-store";
import { getSessionFromRequest } from "@/lib/auth";
import type { AppState } from "@/lib/types";

// Always run dynamically — never cache responses.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireSession(req: NextRequest): NextResponse | null {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Blob storage not configured", state: null },
      { status: 503 }
    );
  }

  try {
    const state = await readState();
    return NextResponse.json({ state });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Blob storage not configured" },
      { status: 503 }
    );
  }

  let body: { state?: AppState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Missing state object" }, { status: 400 });
  }

  try {
    await writeState(body.state);
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
