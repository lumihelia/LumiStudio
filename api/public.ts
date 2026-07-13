import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toPublicView } from "../src/utils/format.js";
import { getPublicEntries } from "./public-data.js";

const site = "https://studio.lumihelia.com";
export const escape = (value: string) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const entries = await getPublicEntries();
    const items = entries.map((entry) => {
      const view = toPublicView(entry);
      return `<article><p>${escape(view.projectTag ?? "公开材料")}</p><h2><a href="/p/${encodeURIComponent(entry.id)}">${escape(view.title)}</a></h2><p>${escape(view.whatItSays ?? view.judgmentStatement ?? "")}</p></article>`;
    }).join("") || "<p>暂时没有公开内容。</p>";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(page("LumiStudio 公开页", "由用户确认公开的材料与判断。", `<main><p class="eyebrow">LumiStudio / Public</p><h1>公开的材料与判断</h1>${items}</main>`));
  } catch { res.status(500).send("Public page unavailable"); }
}

export function page(title: string, description: string, body: string, canonicalPath = "/public") {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${site}${canonicalPath}"><style>body{margin:0;background:#F4F3F7;color:#2C2C2C;font:20px/1.7 Georgia,serif}main{max-width:760px;margin:auto;padding:64px 24px}h1{font-size:42px;line-height:1.2}h2{font-size:28px;line-height:1.3;margin:0}article{border-top:1px solid #D4D0E0;padding:24px 0}article p:first-child,.eyebrow{color:#6B5B8A;font-size:14px;letter-spacing:.04em}a{color:#4C436F;text-decoration:none}a:hover{text-decoration:underline}</style></head><body>${body}</body></html>`;
}
