import type { SupabaseClient } from "@supabase/supabase-js";
import { Album, CollectionItem, PurchaseMeta, AlbumSource } from "@/lib/types";

/**
 * Supabase-backed collection store used when a user is signed in.
 * Mirrors the localStorage API (fetch / add / update / remove / import) so the
 * `useCollection` hook can swap backends transparently. Shapes map to the
 * `albums` and `collection_items` tables in docs/DATABASE.md.
 */

// ---- mapping: app (camelCase) <-> db (snake_case) --------------------------

function albumToRow(a: Album): Record<string, unknown> {
  return {
    id: a.id,
    source: a.source,
    source_id: a.sourceId,
    title: a.title,
    artist: a.artist,
    year: a.year ?? null,
    format: a.format ?? null,
    label: a.label ?? null,
    catalog_number: a.catalogNumber ?? null,
    country: a.country ?? null,
    thumb: a.thumb ?? null,
    cover_image: a.coverImage ?? null,
    genres: a.genres ?? [],
    tracklist: a.tracklist ?? null,
    source_url: a.sourceUrl ?? null,
  };
}

function metaToRow(meta: PurchaseMeta): Record<string, unknown> {
  return {
    acquired_date: meta.acquiredDate ?? null,
    price_paid: meta.pricePaid ?? null,
    currency: meta.currency ?? null,
    condition: meta.condition ?? null,
    store: meta.store ?? null,
    store_lat: meta.storeLat ?? null,
    store_lng: meta.storeLng ?? null,
    notes: meta.notes ?? null,
  };
}

interface AlbumRow {
  id: string;
  source: AlbumSource;
  source_id: string;
  title: string;
  artist: string;
  year: number | null;
  format: string | null;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
  thumb: string | null;
  cover_image: string | null;
  genres: string[] | null;
  tracklist: Album["tracklist"] | null;
  source_url: string | null;
}

interface ItemRow {
  album_id: string;
  added_at: string | null;
  acquired_date: string | null;
  price_paid: number | null;
  currency: string | null;
  condition: string | null;
  store: string | null;
  store_lat: number | null;
  store_lng: number | null;
  notes: string | null;
  albums: AlbumRow | null;
}

function rowToItem(row: ItemRow): CollectionItem | null {
  const a = row.albums;
  if (!a) return null;
  return {
    id: a.id,
    source: a.source,
    sourceId: a.source_id,
    title: a.title,
    artist: a.artist,
    year: a.year ?? undefined,
    format: a.format ?? undefined,
    label: a.label ?? undefined,
    catalogNumber: a.catalog_number ?? undefined,
    country: a.country ?? undefined,
    thumb: a.thumb ?? undefined,
    coverImage: a.cover_image ?? undefined,
    genres: a.genres ?? undefined,
    tracklist: a.tracklist ?? undefined,
    sourceUrl: a.source_url ?? undefined,
    addedAt: row.added_at ?? undefined,
    acquiredDate: row.acquired_date ?? undefined,
    pricePaid: row.price_paid ?? undefined,
    currency: row.currency ?? undefined,
    condition: row.condition ?? undefined,
    store: row.store ?? undefined,
    storeLat: row.store_lat ?? undefined,
    storeLng: row.store_lng ?? undefined,
    notes: row.notes ?? undefined,
  };
}

const ITEM_SELECT =
  "album_id, added_at, acquired_date, price_paid, currency, condition, store, store_lat, store_lng, notes, albums(*)";

// ---- operations ------------------------------------------------------------

export async function fetchItems(
  supabase: SupabaseClient
): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from("collection_items")
    .select(ITEM_SELECT)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ItemRow[])
    .map(rowToItem)
    .filter((x): x is CollectionItem => x !== null);
}

export async function addItem(
  supabase: SupabaseClient,
  userId: string,
  album: Album,
  meta: PurchaseMeta,
  addedAt: string
): Promise<void> {
  const { error: albErr } = await supabase
    .from("albums")
    .upsert(albumToRow(album), { onConflict: "id" });
  if (albErr) throw albErr;

  const { error } = await supabase.from("collection_items").insert({
    user_id: userId,
    album_id: album.id,
    added_at: addedAt,
    ...metaToRow(meta),
  });
  if (error) throw error;
}

export async function updateItem(
  supabase: SupabaseClient,
  userId: string,
  albumId: string,
  meta: PurchaseMeta
): Promise<void> {
  const { error } = await supabase
    .from("collection_items")
    .update(metaToRow(meta))
    .eq("user_id", userId)
    .eq("album_id", albumId);
  if (error) throw error;
}

export async function removeItem(
  supabase: SupabaseClient,
  userId: string,
  albumId: string
): Promise<void> {
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("user_id", userId)
    .eq("album_id", albumId);
  if (error) throw error;
}

/**
 * One-time import of a guest's localStorage collection on first sign-in.
 * Upserts albums, then inserts collection_items without overwriting anything
 * the account already has (ignoreDuplicates on the user_id+album_id unique key).
 */
export async function importItems(
  supabase: SupabaseClient,
  userId: string,
  items: CollectionItem[]
): Promise<void> {
  if (items.length === 0) return;

  const albumRows = items.map(albumToRow);
  const { error: albErr } = await supabase
    .from("albums")
    .upsert(albumRows, { onConflict: "id" });
  if (albErr) throw albErr;

  const itemRows = items.map((it) => ({
    user_id: userId,
    album_id: it.id,
    added_at: it.addedAt ?? new Date().toISOString(),
    ...metaToRow(it),
  }));
  const { error } = await supabase
    .from("collection_items")
    .upsert(itemRows, { onConflict: "user_id,album_id", ignoreDuplicates: true });
  if (error) throw error;
}
