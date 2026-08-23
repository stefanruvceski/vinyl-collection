import type { Metadata } from "next";
import Link from "next/link";
import AlbumCard from "@/components/AlbumCard";
import { getArtistAlbums } from "@/lib/albums";
import { siteConfig } from "@/lib/site";

interface Params {
  params: { name: string };
}

// Artist discographies are fairly stable — cache the SSR page for an hour.
export const revalidate = 3600;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  const path = `/artist/${encodeURIComponent(name)}`;
  return {
    title: name,
    description: `Vinyl albums by ${name}. Browse ${name}'s records and mark the ones you own in your collection.`,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      title: `${name} — vinyl albums`,
      description: `Browse vinyl albums by ${name}.`,
      url: `${siteConfig.url}${path}`,
    },
  };
}

export default async function ArtistPage({ params }: Params) {
  const name = decodeURIComponent(params.name);
  const albums = await getArtistAlbums(name);

  return (
    <div>
      <Link
        href="/"
        className="text-[13px] text-secondary transition-colors hover:text-accent"
      >
        ← Back to search
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {name}
      </h1>

      {albums.length > 0 ? (
        <>
          <p className="mb-6 mt-1 text-[14px] text-secondary">
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 text-[15px] text-secondary">
          No vinyl albums found for “{name}”.
        </p>
      )}
    </div>
  );
}
