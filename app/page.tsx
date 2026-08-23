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
    <div className="mx-auto max-w-3xl">
      <section className="pb-6 pt-6 text-center sm:pt-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Do you already own
          <br className="hidden sm:block" /> this record?
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-secondary sm:text-base">
          Search for an album, mark what you own, and never buy a duplicate
          again. Data is pulled automatically from Discogs and MusicBrainz.
        </p>
      </section>

      <section className="mt-2">
        <SearchBar />
      </section>
    </div>
  );
}
