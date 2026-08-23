import type { Metadata } from "next";
import CollectionBrowser from "@/components/CollectionBrowser";

// The collection is private, per-browser (localStorage) — we don't index it.
export const metadata: Metadata = {
  title: "My collection",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
        My collection
      </h1>
      <CollectionBrowser />
    </div>
  );
}
