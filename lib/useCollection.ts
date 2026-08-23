"use client";

import { useCallback, useEffect, useState } from "react";
import { Album } from "./types";

const STORAGE_KEY = "vinyl-collection";
const EVENT = "vinyl-collection:changed";

function readStore(): Album[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Album[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: Album[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Obavesti druge instance hooka u istom tabu.
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // localStorage nedostupan (npr. privatni mod) — tiho ignorisi.
  }
}

/**
 * Kolekcija u localStorage. Vraca `items` + `add`/`remove`/`toggle`/`has`.
 * SSR-safe: pocetno prazno, ucita se u useEffect da bi hydration prosao cist.
 */
export function useCollection() {
  const [items, setItems] = useState<Album[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStore());
    setReady(true);

    const sync = () => setItems(readStore());
    // Promene u istom tabu (custom event) i u drugim tabovima (storage event).
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((album: Album) => {
    setItems((prev) => {
      if (prev.some((a) => a.id === album.id)) return prev;
      const next = [album, ...prev];
      writeStore(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((a) => a.id !== id);
      writeStore(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (id: string) => items.some((a) => a.id === id),
    [items]
  );

  const toggle = useCallback(
    (album: Album) => {
      if (items.some((a) => a.id === album.id)) remove(album.id);
      else add(album);
    },
    [items, add, remove]
  );

  return { items, ready, add, remove, toggle, has };
}
