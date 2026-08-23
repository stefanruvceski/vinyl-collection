import { NextRequest, NextResponse } from "next/server";
import { getAlbum } from "@/lib/albums";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { source: string; id: string } }
) {
  try {
    const album = await getAlbum(params.source, params.id);
    if (!album) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json(album, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("album error", err);
    return NextResponse.json({ error: "album-failed" }, { status: 502 });
  }
}
