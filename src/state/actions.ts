import type { EntryDraft } from "../utils/extraction";

export type RouteDestination = "published" | "parked";

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
        retell?: string;
        publishCaptureNote?: boolean;
        publishRelevanceToMe?: boolean;
        onSettled?: (ok: boolean) => void;
      };
    }
  | { type: "ROUTE_ENTRY"; payload: { id: string; destination: RouteDestination } }
  | { type: "DISCARD_ENTRY"; payload: { id: string } }
  | { type: "CLEAR_ALL" };
