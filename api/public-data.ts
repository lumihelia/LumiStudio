import { createClient } from "@supabase/supabase-js";
import { rowToEntry, type EntryRow } from "../src/data/entryMapper.js";
import { isPublishedEntry } from "../src/data/types.js";

export async function getPublicEntries() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Public projection is not configured");
  const { data, error } = await createClient(url, key).from("entries").select("*").eq("is_public", true).order("processed_at", { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry).filter(isPublishedEntry);
}
