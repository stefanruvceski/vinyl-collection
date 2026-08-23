"use client";

import { useEffect, useState } from "react";

/** Vraca vrednost tek nakon `delay` ms bez promene (debounce). */
export function useDebouncedValue<T>(value: T, delay = 325): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
