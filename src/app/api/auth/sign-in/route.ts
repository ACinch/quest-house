import { NextRequest, NextResponse } from "next/server";
import {
  buildSessionCookie,
  getCredentialsConfigured,
  signSession,
  verifyCredentials,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SignInBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  if (!getCredentialsConfigured()) {
    return NextResponse.json(
      { error: "No credentials configured on the server" },
      { status: 503 }
    );
  }

  let body: SignInBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const userId = verifyCredentials(username, password);
  if (!userId) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  let token: string;
  try {
    token = signSession(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const res = NextResponse.json({
    user: { id: userId, username },
  });
  res.headers.set("Set-Cookie", buildSessionCookie(token));
  return res;
}
