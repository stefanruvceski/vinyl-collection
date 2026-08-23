import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — do you already own this record?`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
      <section className="py-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Do you already own this record?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
          Search for an album, mark what you own, and never buy a duplicate
          again. Data is pulled automatically from Discogs and MusicBrainz.
        </p>
      </section>

      <section className="mt-4">
        <SearchBar />
      </section>
    </div>
  );
}
