import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — da li već imaš tu ploču?`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
      <section className="py-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Da li već imaš tu ploču?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
          Pretraži album, označi šta imaš, i nikad više ne kupi duplikat. Podaci
          se povlače automatski sa Discogs-a i MusicBrainz-a.
        </p>
      </section>

      <section className="mt-4">
        <SearchBar />
      </section>
    </div>
  );
}
