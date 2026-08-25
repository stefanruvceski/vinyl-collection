import type { Metadata } from "next";
import CollectionBrowser from "@/components/CollectionBrowser";
import ShareCollectionButton from "@/components/ShareCollectionButton";

// The collection is private, per-browser (localStorage) — we don't index it.
export const metadata: Metadata = {
  title: "My collection",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          My collection
        </h1>
        <ShareCollectionButton />
      </div>
      <CollectionBrowser />
    </div>
  );
}
