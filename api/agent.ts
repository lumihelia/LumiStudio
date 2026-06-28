import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { rowToEntry } from "../src/data/entryMapper.js";
import type { EntryRow } from "../src/data/entryMapper.js";
import { toAgentShape, toRssFeed, toMarkdown } from "../src/utils/format.js";
import { isPublishedEntry } from "../src/data/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Server missing Supabase configuration" });
    return;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("is_public", true)
    .order("processed_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const publicEntries = (data as EntryRow[]).map(rowToEntry).filter(isPublishedEntry);
  const format =
    req.query.format === "markdown" || req.query.format === "feed"
      ? req.query.format
      : "json";

  if (format === "markdown") {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.status(200).send(toMarkdown(publicEntries));
    return;
  }

  if (format === "feed") {
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.status(200).send(toRssFeed(publicEntries));
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    entries: publicEntries.map((entry) => toAgentShape(entry, publicEntries)),
  });
}
