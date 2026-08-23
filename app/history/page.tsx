import type { Metadata } from "next";
import PurchaseHistory from "@/components/PurchaseHistory";

// Private, per-browser (localStorage) — not indexed.
export const metadata: Metadata = {
  title: "Purchase history",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Purchase history
      </h1>
      <PurchaseHistory />
    </div>
  );
}
