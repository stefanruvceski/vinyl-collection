import { NextRequest, NextResponse } from "next/server";
import { searchAlbums } from "@/lib/albums";
import { SearchMode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const modeParam = req.nextUrl.searchParams.get("mode");
  const mode: SearchMode = modeParam === "suggest" ? "suggest" : "full";

  if (q.trim().length < 3) {
    return NextResponse.json({ results: [], source: "discogs", query: q.trim() });
  }

  try {
    const data = await searchAlbums(q, mode);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    console.error("search error", err);
    return NextResponse.json(
      { error: "search-failed", results: [] },
      { status: 502 }
    );
  }
}
