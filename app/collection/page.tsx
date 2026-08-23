import type { Metadata } from "next";
import CollectionList from "@/components/CollectionList";

// The collection is private, per-browser (localStorage) — we don't index it.
export const metadata: Metadata = {
  title: "My collection",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <div className="py-2">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">My collection</h1>
      <CollectionList />
    </div>
  );
}
