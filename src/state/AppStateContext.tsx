import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Entry } from "../data/types";
import type { Action } from "./actions";
import { SEED_ENTRIES } from "../data/seedEntries";
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
    setEntries((data as EntryRow[]).map(rowToEntry));
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
          const { title, captureNote, sourceType } = action.payload;
          const newEntry: Omit<Entry, "id"> = {
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
          supabase
            .from("entries")
            .update(entryToRow(fields))
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
            .delete()
            .eq("id", action.payload.id)
            .then(({ error }) => {
              if (error) console.error("DISCARD_ENTRY failed", error);
              else refetch();
            });
          break;
        }
        case "RESET_TO_SEED": {
          (async () => {
            const { error: deleteError } = await supabase
              .from("entries")
              .delete()
              .not("id", "is", null);
            if (deleteError) {
              console.error("RESET_TO_SEED delete failed", deleteError);
              return;
            }
            const { error: insertError } = await supabase
              .from("entries")
              .insert(SEED_ENTRIES.map((entry) => entryToRow(entry)));
            if (insertError) {
              console.error("RESET_TO_SEED insert failed", insertError);
              return;
            }
            refetch();
          })();
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
