import { NextRequest, NextResponse } from "next/server";
import {
  getCredentials,
  getCredentialsConfigured,
  getSessionFromRequest,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        user: null,
        credentialsConfigured: getCredentialsConfigured(),
        secretConfigured: Boolean(process.env.AUTH_SECRET),
      },
      { status: 200 }
    );
  }

  // Look up the username so the client can show it.
  const cred = getCredentials().find((c) => c.userId === session.uid);
  return NextResponse.json({
    user: {
      id: session.uid,
      username: cred?.username ?? session.uid,
    },
    credentialsConfigured: true,
    secretConfigured: true,
  });
}
