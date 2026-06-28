import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Entry } from "../data/types";
import type { Action } from "./actions";
import { supabase } from "../lib/supabaseClient";
import { rowToEntry, entryToRow } from "../data/entryMapper";
import type { EntryRow } from "../data/entryMapper";

const POLL_INTERVAL_MS = 3000;

interface AppStateValue {
  entries: Entry[];
  dispatch: (action: Action) => void;
}

export const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const entriesRef = useRef<Entry[]>([]);
  entriesRef.current = entries;

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("captured_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch entries", error);
      return;
    }
    setEntries(
      (data as EntryRow[])
        .map(rowToEntry)
        .filter((entry) => entry.status !== "discarded")
    );
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refetch]);

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "ADD_ENTRY": {
          const draft = action.payload;
          const newEntry: Omit<Entry, "id"> = {
            sourceType: draft.sourceType,
            title: draft.title.trim() || "还没起标题的一条",
            origin: draft.origin,
            captureNote: draft.captureNote.trim(),
            whatItSays: draft.whatItSays,
            relevanceToMe: draft.relevanceToMe,
            projectTag: null,
            judgmentStatement: "",
            nextAction: "",
            status: draft.wasExtracted ? "extracted" : "captured",
            isPublic: false,
            capturedAt: new Date().toISOString(),
            processedAt: null,
            tags: draft.tags,
            coreBullets: draft.coreBullets,
          };
          supabase
            .from("entries")
            .insert(entryToRow(newEntry))
            .then(({ error }) => {
              if (error) console.error("ADD_ENTRY failed", error);
              else refetch();
            });
          break;
        }
        case "UPDATE_JUDGMENT": {
          const { id, ...fields } = action.payload;
          const existing = entriesRef.current.find((e) => e.id === id);
          if (existing?.status === "discarded") break;
          const nextStatus =
            existing && (existing.status === "published" || existing.status === "connected")
              ? existing.status
              : "reviewed";
          supabase
            .from("entries")
            .update(entryToRow({ ...fields, status: nextStatus, processedAt: new Date().toISOString() }))
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.error("UPDATE_JUDGMENT failed", error);
              else refetch();
            });
          break;
        }
        case "ROUTE_ENTRY": {
          const { id, destination } = action.payload;
          const existing = entriesRef.current.find((e) => e.id === id);
          supabase
            .from("entries")
            .update(
              entryToRow({
                status: destination,
                isPublic: destination === "published",
                processedAt: existing?.processedAt ?? new Date().toISOString(),
              })
            )
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.error("ROUTE_ENTRY failed", error);
              else refetch();
            });
          break;
        }
        case "DISCARD_ENTRY": {
          supabase
            .from("entries")
            .update(
              entryToRow({
                status: "discarded",
                isPublic: false,
                processedAt: new Date().toISOString(),
              })
            )
            .eq("id", action.payload.id)
            .then(({ error }) => {
              if (error) console.error("DISCARD_ENTRY failed", error);
              else refetch();
            });
          break;
        }
        case "CLEAR_ALL": {
          supabase
            .from("entries")
            .delete()
            .not("id", "is", null)
            .then(({ error }) => {
              if (error) console.error("CLEAR_ALL failed", error);
              else refetch();
            });
          break;
        }
      }
    },
    [refetch]
  );

  return (
    <AppStateContext.Provider value={{ entries, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}
