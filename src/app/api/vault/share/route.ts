import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentId, documentName, durationHours = 24 } = body;

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const token = "vsh_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    return NextResponse.json({
      token,
      documentId,
      documentName,
      expiresAt,
      url: `/share/vault/${token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create share link" }, { status: 500 });
  }
}

