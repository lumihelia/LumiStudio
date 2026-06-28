import { createContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import type { Entry } from "../data/types";
import type { Action } from "./appReducer";
import { appReducer } from "./appReducer";
import { loadEntries, saveEntries } from "../lib/localStorage";

interface AppStateValue {
  entries: Entry[];
  dispatch: React.Dispatch<Action>;
}

export const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(appReducer, undefined, loadEntries);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  return (
    <AppStateContext.Provider value={{ entries, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}
