/**
 * Case-insensitive, trim-normalized index lookup for campaign products/actions.
 * Ensures "Write a review" / "write a review" and "Earl Grey Tea" / "Earl grey tea"
 * map to the same circle so stamps stay anchored to the correct label.
 */
export function indexInList(list: string[], itemName: string): number {
  const n = (itemName ?? '').trim().toLowerCase();
  if (!n) return -1;
  return list.findIndex((x) => (x ?? '').trim().toLowerCase() === n);
}

/** Return the list's exact string for this item if found; otherwise itemName. Use when storing to avoid case drift. */
export function canonicalName(list: string[], itemName: string): string {
  const i = indexInList(list, itemName);
  return i >= 0 && list[i] != null ? list[i]! : (itemName ?? '').trim();
}

export function namesMatch(a: string, b: string): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();
}
