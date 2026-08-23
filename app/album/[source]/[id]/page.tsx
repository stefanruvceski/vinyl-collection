import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionButton from "@/components/CollectionButton";
import JsonLd from "@/components/JsonLd";
import VinylArtwork from "@/components/VinylArtwork";
import { getAlbum } from "@/lib/albums";
import { siteConfig } from "@/lib/site";
import { Album } from "@/lib/types";

interface Params {
  params: { source: string; id: string };
}

// Detalji su relativno stabilni — kesiraj SSR na sat vremena.
export const revalidate = 3600;

async function load(params: Params["params"]): Promise<Album | null> {
  return getAlbum(params.source, decodeURIComponent(params.id));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const album = await load(params);
  if (!album) {
    return { title: "Album not found" };
  }
  const title = `${album.artist} – ${album.title}`;
  const parts = [album.year, album.format, album.label].filter(Boolean).join(" · ");
  const description = `${title}${parts ? ` (${parts})` : ""}. Add it to your vinyl collection and keep track of what you already own.`;
  const path = `/album/${album.source}/${encodeURIComponent(album.sourceId)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "music.album",
      title,
      description,
      url: `${siteConfig.url}${path}`,
      images: album.coverImage ? [{ url: album.coverImage }] : undefined,
    },
    twitter: {
      card: album.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: album.coverImage ? [album.coverImage] : undefined,
    },
  };
}

export default async function AlbumPage({ params }: Params) {
  const album = await load(params);
  if (!album) notFound();

  const musicAlbumLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    byArtist: { "@type": "MusicGroup", name: album.artist },
    ...(album.coverImage ? { image: album.coverImage } : {}),
    ...(album.year ? { datePublished: String(album.year) } : {}),
    ...(album.genres?.length ? { genre: album.genres } : {}),
    ...(album.label
      ? { recordLabel: { "@type": "Organization", name: album.label } }
      : {}),
    ...(album.tracklist?.length
      ? {
          numTracks: album.tracklist.length,
          track: album.tracklist.map((t, i) => ({
            "@type": "MusicRecording",
            name: t.title,
            position: t.position || i + 1,
          })),
        }
      : {}),
    ...(album.sourceUrl ? { sameAs: album.sourceUrl } : {}),
  };

  const meta = [
    ["Artist", album.artist],
    ["Year", album.year?.toString()],
    ["Format", album.format],
    ["Label", album.label],
    ["Catalog number", album.catalogNumber],
    ["Country", album.country],
    ["Genre", album.genres?.join(", ")],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={musicAlbumLd} />

      <Link
        href="/"
        className="text-[13px] text-secondary transition-colors hover:text-accent"
      >
        ← Back to search
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {album.title}
        </h1>
        <p className="mt-1.5 text-xl font-medium text-accent">{album.artist}</p>
        <p className="mt-2 text-[13px] uppercase tracking-wide text-secondary">
          {[album.genres?.[0], album.year, album.format]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-9 w-52 sm:w-64">
          <VinylArtwork
            variant="detail"
            src={album.coverImage || album.thumb}
            alt={`${album.artist} – ${album.title}`}
          />
        </div>

        <div className="mt-9">
          <CollectionButton album={album} />
        </div>
      </div>

      {album.tracklist?.length ? (
        <section className="mt-12">
          <h2 className="mb-1 text-[22px] font-bold tracking-tight">Tracklist</h2>
          <ol>
            {album.tracklist.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-4 border-b border-hair py-3 text-[15px]"
              >
                <span className="w-6 shrink-0 text-right text-secondary">
                  {t.position || i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.duration && (
                  <span className="shrink-0 tabular-nums text-secondary">
                    {t.duration}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="mb-1 text-[22px] font-bold tracking-tight">Details</h2>
        <dl>
          {meta.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 border-b border-hair py-3 text-[15px]"
            >
              <dt className="text-secondary">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {album.sourceUrl && (
        <p className="mt-8 text-[12px] text-secondary">
          Data source:{" "}
          <a
            href={album.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-accent"
          >
            {album.source === "discogs" ? "Discogs" : "MusicBrainz"}
          </a>
        </p>
      )}
    </article>
  );
}
