import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Photon (Komoot) — free, no key, OpenStreetMap-based, built for autocomplete.
const PHOTON = "https://photon.komoot.io/api/";

interface PhotonFeature {
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 3) return NextResponse.json({ results: [] });

  const url = new URL(PHOTON);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "en");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VinylNation/0.1 (+https://vinyl-nation.vercel.app)" },
    });
    if (!res.ok) throw new Error(`photon-${res.status}`);
    const data = (await res.json()) as { features?: PhotonFeature[] };

    const seen = new Set<string>();
    const results = (data.features ?? [])
      .map((f) => {
        const p = f.properties ?? {};
        const coords = f.geometry?.coordinates;
        if (!coords) return null;
        const label = [p.name, p.city ?? p.state, p.country]
          .filter(Boolean)
          .join(", ");
        if (!label) return null;
        return {
          id: `${p.osm_type ?? "x"}${p.osm_id ?? label}`,
          label,
          lat: coords[1],
          lng: coords[0],
        };
      })
      .filter((r): r is { id: string; label: string; lat: number; lng: number } => {
        if (!r || seen.has(r.label)) return false;
        seen.add(r.label);
        return true;
      });

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (err) {
    console.error("geocode error", err);
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
