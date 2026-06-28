import type { Entry } from "../data/types";
import { SEED_ENTRIES } from "../data/seedEntries";

const STORAGE_KEY = "lumistudio.entries.v1";

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ENTRIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_ENTRIES;
    return parsed as Entry[];
  } catch {
    return SEED_ENTRIES;
  }
}

export function saveEntries(entries: Entry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable (private mode, quota) — in-memory state still works for this session
  }
}
