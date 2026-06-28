import type { Entry, LifecycleStatus, SourceType } from "../data/types";
import { SEED_ENTRIES } from "../data/seedEntries";

export type RouteDestination = "published" | "connected" | "parked";

export type Action =
  | {
      type: "ADD_ENTRY";
      payload: { title: string; captureNote: string; sourceType: SourceType };
    }
  | {
      type: "UPDATE_JUDGMENT";
      payload: {
        id: string;
        relevanceToMe?: string;
        projectTag?: string | null;
        judgmentStatement?: string;
        nextAction?: string;
      };
    }
  | { type: "ROUTE_ENTRY"; payload: { id: string; destination: RouteDestination } }
  | { type: "DISCARD_ENTRY"; payload: { id: string } }
  | { type: "RESET_TO_SEED" };

function statusFromDestination(destination: RouteDestination): LifecycleStatus {
  return destination;
}

export function appReducer(entries: Entry[], action: Action): Entry[] {
  switch (action.type) {
    case "ADD_ENTRY": {
      const { title, captureNote, sourceType } = action.payload;
      const newEntry: Entry = {
        id: `e_${Date.now().toString(36)}`,
        sourceType,
        title: title.trim() || "还没起标题的一条",
        origin: "手机端收进来",
        captureNote: captureNote.trim(),
        whatItSays: "",
        relevanceToMe: "",
        projectTag: null,
        judgmentStatement: "",
        nextAction: "",
        status: "captured",
        isPublic: false,
        capturedAt: new Date().toISOString(),
        processedAt: null,
      };
      return [newEntry, ...entries];
    }
    case "UPDATE_JUDGMENT": {
      const { id, ...fields } = action.payload;
      return entries.map((entry) =>
        entry.id === id ? { ...entry, ...fields } : entry
      );
    }
    case "ROUTE_ENTRY": {
      const { id, destination } = action.payload;
      return entries.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          status: statusFromDestination(destination),
          isPublic: destination === "published",
          processedAt: entry.processedAt ?? new Date().toISOString(),
        };
      });
    }
    case "DISCARD_ENTRY": {
      return entries.filter((entry) => entry.id !== action.payload.id);
    }
    case "RESET_TO_SEED": {
      return [...SEED_ENTRIES];
    }
    default:
      return entries;
  }
}
