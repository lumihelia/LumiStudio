import type { EntryDraft } from "../utils/extraction";

export type RouteDestination = "published" | "connected" | "parked";

export type Action =
  | {
      type: "ADD_ENTRY";
      payload: EntryDraft;
    }
  | {
      type: "UPDATE_JUDGMENT";
      payload: {
        id: string;
        captureNote?: string;
        whatItSays?: string;
        relevanceToMe?: string;
        projectTag?: string | null;
        judgmentStatement?: string;
        nextAction?: string;
        tags?: string[];
        coreBullets?: string[];
      };
    }
  | { type: "ROUTE_ENTRY"; payload: { id: string; destination: RouteDestination } }
  | { type: "DISCARD_ENTRY"; payload: { id: string } }
  | { type: "CLEAR_ALL" };
