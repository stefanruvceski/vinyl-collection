import type { Metadata } from "next";
import PurchasesMap from "@/components/PurchasesMap";

// Private, per-browser (localStorage) — not indexed.
export const metadata: Metadata = {
  title: "Purchases map",
  robots: { index: false, follow: false },
};

export default function MapPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Where you buy records
      </h1>
      <p className="mb-6 text-[14px] text-secondary">
        Every shop you tagged under “Bought at”, on the map.
      </p>
      <PurchasesMap />
    </div>
  );
}
