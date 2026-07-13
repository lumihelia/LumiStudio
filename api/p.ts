import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toPublicView } from "../src/utils/format.js";
import { getPublicEntries } from "./public-data.js";
import { escape, page } from "./public.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id ?? "");
    const entry = (await getPublicEntries()).find((item) => item.id === id);
    if (!entry) return res.status(404).send("Not found");
    const view = toPublicView(entry);
    const sections = [["这篇讲了什么", view.whatItSays ? `<p>${escape(view.whatItSays)}</p>` : ""], ["核心观点", view.coreBullets.length ? `<ul>${view.coreBullets.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""], ["复述", view.retell ? `<p>${escape(view.retell)}</p>` : ""], ["相关判断", view.judgmentStatement ? `<p>${escape(view.judgmentStatement)}</p>` : ""]].filter(([, value]) => value).map(([title, value]) => `<section><h2>${title}</h2>${value}</section>`).join("");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(page(view.title, view.whatItSays ?? "LumiStudio 公开材料", `<main><p class="eyebrow">LumiStudio / Public</p><h1>${escape(view.title)}</h1>${sections}</main>`));
  } catch { res.status(500).send("Public page unavailable"); }
}
