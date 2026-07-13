import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPublicEntries } from "./public-data.js";

const site = "https://studio.lumihelia.com";
const escape = (value: string) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const entries = await getPublicEntries();
    const urls = [`<url><loc>${site}/public</loc></url>`, ...entries.map((entry) => `<url><loc>${site}/p/${encodeURIComponent(entry.id)}</loc><lastmod>${escape(entry.processedAt ?? entry.capturedAt)}</lastmod></url>`)].join("");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch { res.status(500).send("Sitemap unavailable"); }
}
