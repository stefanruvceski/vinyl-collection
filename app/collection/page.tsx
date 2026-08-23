import type { Metadata } from "next";
import CollectionList from "@/components/CollectionList";

// Kolekcija je privatna, po pregledaču (localStorage) — ne indeksiramo je.
export const metadata: Metadata = {
  title: "Moja kolekcija",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <div className="py-2">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Moja kolekcija</h1>
      <CollectionList />
    </div>
  );
}
