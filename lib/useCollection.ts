"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Album, CollectionItem, PurchaseMeta } from "./types";
import { useAuth } from "@/components/AuthProvider";
import {
  addItem,
  fetchItems,
  importItems,
  removeItem,
  updateItem,
} from "./collection/remote";

const STORAGE_KEY = "vinyl-collection";
const EVENT = "vinyl-collection:changed";

function readStore(): CollectionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CollectionItem[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: CollectionItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // localStorage unavailable (e.g. private mode) — ignore silently.
  }
}

function broadcast(): void {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* no-op */
  }
}

/** Import a guest's localStorage collection into the account once per user. */
async function maybeImport(
  supabase: NonNullable<ReturnType<typeof useAuth>["supabase"]>,
  userId: string
): Promise<void> {
  const flag = `vinyl-imported:${userId}`;
  try {
    if (window.localStorage.getItem(flag)) return;
    const local = readStore();
    if (local.length) await importItems(supabase, userId, local);
    window.localStorage.setItem(flag, "1");
  } catch {
    // Best-effort: a failed import shouldn't block using the account.
  }
}

/**
 * The collection. Signed in → Supabase (synced across devices, with a one-time
 * import of any guest data). Guest → localStorage, exactly as before. The public
 * API (items/ready/add/remove/update/has/get/toggle) is identical either way.
 */
export function useCollection() {
  const { supabase, user, ready: authReady } = useAuth();
  const userId = user?.id ?? null;
  const signedIn = !!(supabase && userId);

  const [items, setItems] = useState<CollectionItem[]>([]);
  const [ready, setReady] = useState(false);

  // Keep the latest state for optimistic-write helpers without re-subscribing.
  const itemsRef = useRef<CollectionItem[]>([]);
  itemsRef.current = items;

  const reload = useCallback(async () => {
    if (signedIn && supabase) {
      try {
        setItems(await fetchItems(supabase));
      } catch {
        setItems([]);
      }
    } else {
      setItems(readStore());
    }
  }, [signedIn, supabase]);

  useEffect(() => {
    // Wait for the initial auth check so we don't flash guest → signed-in.
    if (!authReady) {
      setReady(false);
      return;
    }

    let active = true;
    setReady(false);

    (async () => {
      if (signedIn && supabase && userId) {
        await maybeImport(supabase, userId);
        try {
          const rows = await fetchItems(supabase);
          if (active) setItems(rows);
        } catch {
          if (active) setItems([]);
        }
      } else if (active) {
        setItems(readStore());
      }
      if (active) setReady(true);
    })();

    const onChanged = () => {
      if (signedIn && supabase) {
        fetchItems(supabase)
          .then((rows) => active && setItems(rows))
          .catch(() => {});
      } else {
        setItems(readStore());
      }
    };
    window.addEventListener(EVENT, onChanged);
    window.addEventListener("storage", onChanged);
    return () => {
      active = false;
      window.removeEventListener(EVENT, onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, [authReady, signedIn, supabase, userId]);

  const add = useCallback(
    (album: Album, meta?: PurchaseMeta) => {
      if (itemsRef.current.some((a) => a.id === album.id)) return;
      const addedAt = new Date().toISOString();

      if (signedIn && supabase && userId) {
        setItems((prev) => [{ ...album, addedAt, ...meta }, ...prev]);
        addItem(supabase, userId, album, meta ?? {}, addedAt)
          .then(broadcast)
          .catch(() => reload());
      } else {
        setItems((prev) => {
          const next = [{ ...album, addedAt, ...meta }, ...prev];
          writeStore(next);
          return next;
        });
      }
    },
    [signedIn, supabase, userId, reload]
  );

  const remove = useCallback(
    (id: string) => {
      if (signedIn && supabase && userId) {
        setItems((prev) => prev.filter((a) => a.id !== id));
        removeItem(supabase, userId, id).then(broadcast).catch(() => reload());
      } else {
        setItems((prev) => {
          const next = prev.filter((a) => a.id !== id);
          writeStore(next);
          return next;
        });
      }
    },
    [signedIn, supabase, userId, reload]
  );

  const update = useCallback(
    (id: string, meta: PurchaseMeta) => {
      setItems((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...meta } : a));
        if (!(signedIn && supabase && userId)) writeStore(next);
        return next;
      });
      if (signedIn && supabase && userId) {
        updateItem(supabase, userId, id, meta).catch(() => reload());
      }
    },
    [signedIn, supabase, userId, reload]
  );

  const has = useCallback((id: string) => items.some((a) => a.id === id), [items]);
  const get = useCallback((id: string) => items.find((a) => a.id === id), [items]);

  const toggle = useCallback(
    (album: Album) => {
      if (itemsRef.current.some((a) => a.id === album.id)) remove(album.id);
      else add(album);
    },
    [add, remove]
  );

  return { items, ready, add, remove, update, has, get, toggle };
}
