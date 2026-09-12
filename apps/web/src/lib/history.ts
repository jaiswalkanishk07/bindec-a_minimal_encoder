const KEY = "bindec.history";

export type Hist = { at: number; from: string; to: string; value: string; result: string };

export function loadHistory(): Hist[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Hist[];
  } catch {
    return [];
  }
}

export function pushHistory(entry: Hist) {
  const next = [entry, ...loadHistory().filter((h) => h.value !== entry.value || h.from !== entry.from)].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
