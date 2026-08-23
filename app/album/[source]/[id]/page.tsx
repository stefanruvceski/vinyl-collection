import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionButton from "@/components/CollectionButton";
import CoverImage from "@/components/CoverImage";
import JsonLd from "@/components/JsonLd";
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
    return { title: "Album nije pronađen" };
  }
  const title = `${album.artist} – ${album.title}`;
  const parts = [album.year, album.format, album.label].filter(Boolean).join(" · ");
  const description = `${title}${parts ? ` (${parts})` : ""}. Dodaj u svoju vinyl kolekciju i prati šta već imaš.`;
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
    ["Izvođač", album.artist],
    ["Godina", album.year?.toString()],
    ["Format", album.format],
    ["Izdavač", album.label],
    ["Kataloški broj", album.catalogNumber],
    ["Zemlja", album.country],
    ["Žanr", album.genres?.join(", ")],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <article className="py-2">
      <JsonLd data={musicAlbumLd} />

      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        ← Nazad na pretragu
      </Link>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        <CoverImage
          src={album.coverImage || album.thumb}
          alt={`${album.artist} – ${album.title}`}
          className="h-48 w-48 shrink-0 rounded-lg"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{album.title}</h1>
          <p className="mt-1 text-lg text-neutral-400">{album.artist}</p>

          <div className="mt-4">
            <CollectionButton album={album} />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {meta.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-wax-border py-1.5 text-sm">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="ml-4 text-right text-neutral-200">{v}</dd>
          </div>
        ))}
      </dl>

      {album.tracklist?.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Lista pesama</h2>
          <ol className="divide-y divide-wax-border">
            {album.tracklist.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-8 shrink-0 text-neutral-500">
                  {t.position || i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.duration && (
                  <span className="shrink-0 text-neutral-500">{t.duration}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {album.sourceUrl && (
        <p className="mt-8 text-xs text-neutral-600">
          Izvor podataka:{" "}
          <a
            href={album.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-400"
          >
            {album.source === "discogs" ? "Discogs" : "MusicBrainz"}
          </a>
        </p>
      )}
    </article>
  );
}
