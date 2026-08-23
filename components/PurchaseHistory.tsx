"use client";

import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import { CollectionItem } from "@/lib/types";
import CoverImage from "./CoverImage";

/** Date used for ordering + display: purchase date if set, else added date. */
function dateInfo(it: CollectionItem): { key: string; label: string } {
  if (it.acquiredDate) return { key: it.acquiredDate, label: it.acquiredDate };
  if (it.addedAt) {
    const d = it.addedAt.slice(0, 10);
    return { key: d, label: `added ${d}` };
  }
  return { key: "", label: "—" };
}

export default function PurchaseHistory() {
  const { items, ready } = useCollection();

  if (!ready) {
    return <p className="py-16 text-center text-[15px] text-secondary">Loading…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[15px] text-secondary">No records yet.</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Search and add your first record
        </Link>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) =>
    dateInfo(b).key.localeCompare(dateInfo(a).key)
  );

  const totals = new Map<string, number>();
  for (const it of items) {
    if (it.pricePaid) {
      const c = it.currency ?? "RSD";
      totals.set(c, (totals.get(c) ?? 0) + it.pricePaid);
    }
  }
  const fmt = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div>
      {totals.size > 0 && (
        <p className="mb-6 text-[14px] text-secondary">
          Total spent:{" "}
          <span className="font-medium text-accent">
            {[...totals].map(([c, v]) => `${fmt(v)} ${c}`).join(" · ")}
          </span>
        </p>
      )}

      <ul className="divide-y divide-hair">
        {sorted.map((it) => {
          const href = `/album/${it.source}/${encodeURIComponent(it.sourceId)}`;
          const { label } = dateInfo(it);
          return (
            <li key={it.id} className="flex items-center gap-4 py-3">
              <Link href={href} className="shrink-0">
                <CoverImage
                  src={it.thumb}
                  alt={`${it.artist} – ${it.title}`}
                  className="h-14 w-14 rounded-md"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={href} className="block">
                  <p className="truncate text-[15px] font-medium hover:text-accent">
                    {it.title}
                  </p>
                </Link>
                <p className="truncate text-[13px] text-secondary">
                  {it.artist}
                </p>
                <p className="mt-0.5 text-[12px] text-secondary">
                  {label}
                  {it.condition ? ` · ${it.condition}` : ""}
                </p>
              </div>
              {it.pricePaid ? (
                <div className="shrink-0 text-right text-[14px] tabular-nums">
                  {fmt(it.pricePaid)}{" "}
                  <span className="text-secondary">{it.currency ?? "RSD"}</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
