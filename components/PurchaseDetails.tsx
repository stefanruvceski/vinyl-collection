"use client";

import { Album, CURRENCIES, VINYL_CONDITIONS } from "@/lib/types";
import { useCollection } from "@/lib/useCollection";

const fieldClass =
  "bg-elevated w-full rounded-lg border border-hair px-3 py-2 text-[14px] outline-none focus:border-accent/50";
const labelClass = "mb-1 block text-[12px] font-medium text-secondary";

export default function PurchaseDetails({ album }: { album: Album }) {
  const { get, update, ready } = useCollection();
  const item = get(album.id);

  // Only shown for records you own — the add/remove button lives above this.
  if (!ready || !item) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[22px] font-bold tracking-tight">Purchase details</h2>
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-hair bg-elevated/40 p-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="pd-date">
            Purchase date
          </label>
          <input
            id="pd-date"
            type="date"
            className={fieldClass}
            value={item.acquiredDate ?? ""}
            onChange={(e) =>
              update(album.id, { acquiredDate: e.target.value || undefined })
            }
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="pd-price">
            Price paid
          </label>
          <div className="flex gap-2">
            <input
              id="pd-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              className={fieldClass}
              value={item.pricePaid ?? ""}
              onChange={(e) =>
                update(album.id, {
                  pricePaid: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <select
              aria-label="Currency"
              className="bg-elevated rounded-lg border border-hair px-2 text-[14px] text-secondary outline-none focus:border-accent/50"
              value={item.currency ?? CURRENCIES[0]}
              onChange={(e) => update(album.id, { currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="pd-condition">
            Condition
          </label>
          <select
            id="pd-condition"
            className={fieldClass}
            value={item.condition ?? ""}
            onChange={(e) =>
              update(album.id, { condition: e.target.value || undefined })
            }
          >
            <option value="">—</option>
            {VINYL_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="pd-notes">
            Notes
          </label>
          <textarea
            id="pd-notes"
            rows={2}
            placeholder="Where you bought it, pressing details…"
            className={fieldClass}
            value={item.notes ?? ""}
            onChange={(e) =>
              update(album.id, { notes: e.target.value || undefined })
            }
          />
        </div>
      </div>
    </section>
  );
}
