import type { SourceType } from "../data/types";

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
