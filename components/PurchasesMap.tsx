"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useCollection } from "@/lib/useCollection";
import { CollectionItem } from "@/lib/types";

interface Spot {
  lat: number;
  lng: number;
  name: string;
  count: number;
}

function spotsOf(items: CollectionItem[]): Spot[] {
  const groups = new Map<string, Spot>();
  for (const it of items) {
    if (it.storeLat == null || it.storeLng == null) continue;
    const key = `${it.storeLat},${it.storeLng}`;
    const g = groups.get(key);
    if (g) g.count += 1;
    else
      groups.set(key, {
        lat: it.storeLat,
        lng: it.storeLng,
        name: it.store ?? "Unknown",
        count: 1,
      });
  }
  return [...groups.values()];
}

export default function PurchasesMap() {
  const { items, ready } = useCollection();
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  const spots = useMemo(() => (ready ? spotsOf(items) : []), [ready, items]);

  useEffect(() => {
    if (!ready || spots.length === 0 || !elRef.current) return;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !elRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(elRef.current).setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;

      if (markersRef.current) markersRef.current.remove();
      const layer = L.layerGroup();
      const bounds: [number, number][] = [];
      for (const s of spots) {
        const icon = L.divIcon({
          className: "",
          html: `<div class="vn-pin">${s.count}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker([s.lat, s.lng], { icon })
          .bindPopup(
            `<b>${s.name}</b><br>${s.count} record${s.count === 1 ? "" : "s"}`
          )
          .addTo(layer);
        bounds.push([s.lat, s.lng]);
      }
      layer.addTo(map);
      markersRef.current = layer;
      if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, spots]);

  // Tear the map down on unmount.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  if (!ready) {
    return <p className="py-16 text-center text-[15px] text-secondary">Loading…</p>;
  }

  if (spots.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[15px] text-secondary">
          No locations yet. Add a shop under “Bought at” on an album and pick a
          place — it will appear here.
        </p>
        <Link
          href="/collection"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Go to your collection
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={elRef}
      className="h-[70vh] w-full overflow-hidden rounded-xl border border-hair"
    />
  );
}
