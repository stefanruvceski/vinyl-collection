import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/albums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Seeds are pipe-separated (artist/genre names may contain commas).
function parse(v: string | null): string[] {
  return (v ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const artists = parse(req.nextUrl.searchParams.get("artists"));
  const genres = parse(req.nextUrl.searchParams.get("genres"));

  if (artists.length === 0 && genres.length === 0) {
    return NextResponse.json({ sections: [] });
  }

  try {
    const sections = await getRecommendations({ artists, genres });
    return NextResponse.json(
      { sections },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (err) {
    console.error("recommend error", err);
    return NextResponse.json({ sections: [] }, { status: 502 });
  }
}
