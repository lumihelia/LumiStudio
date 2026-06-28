import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createDraftFromMetadata,
  extractFirstUrl,
  inferSourceType,
  truncate,
  type CaptureInput,
  type CaptureMyContext,
  type EntryDraft,
  type ExtractedMetadata,
} from "../src/utils/extraction.js";

const MAX_INPUT_LENGTH = 5000;
const MAX_PAGE_LENGTH = 900000;
const FETCH_TIMEOUT_MS = 6500;
const GEMINI_TIMEOUT_MS = 8000;

// Metadata fetch + Gemini call run sequentially and can together approach
// 15s worst-case; Vercel's default function timeout is 10s on most plans,
// which would kill the whole request before either timeout fires.
export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const input = parseInput(req.body);
  if (!input) {
    res.status(400).json({ error: "Invalid capture payload" });
    return;
  }

  const { draft, mode } = await extractDraftForInput(input);

  res.status(200).json({
    draft,
    extraction: { mode },
  });
}

export async function extractDraftForInput(input: CaptureInput): Promise<{
  draft: EntryDraft;
  mode: "gemini" | "metadata" | "fallback";
}> {
  const url = extractFirstUrl(input.rawInput);
  let metadata: ExtractedMetadata = {};
  let mode: "gemini" | "metadata" | "fallback" = "fallback";

  if (url && isSafeHttpUrl(url)) {
    try {
      metadata = await fetchPageMetadata(url, input);
      mode = metadata.description || metadata.textSnippet || metadata.title ? "metadata" : "fallback";
    } catch (error) {
      console.error("extract metadata failed", error);
    }
  }

  let draft = createDraftFromMetadata(input, metadata);
  const geminiDraft = await draftWithGemini(input, metadata, draft);
  if (geminiDraft) {
    draft = geminiDraft;
    mode = "gemini";
  }

  draft.wasExtracted = mode !== "fallback";
  return { draft, mode };
}

function parseInput(body: unknown): CaptureInput | null {
  let parsed: Partial<CaptureInput>;
  try {
    parsed =
      typeof body === "string"
        ? (JSON.parse(body || "{}") as Partial<CaptureInput>)
        : (body as Partial<CaptureInput>);
  } catch {
    return null;
  }

  const rawInput = String(parsed.rawInput ?? "").slice(0, MAX_INPUT_LENGTH);
  const captureNote = String(parsed.captureNote ?? "").slice(0, 1200);
  const sourceType = parsed.sourceType;

  if (!sourceType || !["article", "video", "podcast", "webpage", "clue"].includes(sourceType)) {
    return null;
  }

  if (!rawInput.trim() && !captureNote.trim()) return null;
  const myContext = sanitizeMyContext(parsed.myContext);
  return { rawInput, captureNote, sourceType, myContext };
}

export function sanitizeMyContext(value: unknown): CaptureMyContext | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<CaptureMyContext>;
  const clean = (list: unknown): string[] =>
    Array.isArray(list)
      ? list.map((item) => String(item).slice(0, 200)).filter(Boolean).slice(0, 12)
      : [];

  const myContext: CaptureMyContext = {
    currentProjects: clean(raw.currentProjects),
    activeQuestions: clean(raw.activeQuestions),
    existingClaims: clean(raw.existingClaims),
  };

  const isEmpty =
    myContext.currentProjects.length === 0 &&
    myContext.activeQuestions.length === 0 &&
    myContext.existingClaims.length === 0;
  return isEmpty ? undefined : myContext;
}

async function draftWithGemini(
  input: CaptureInput,
  metadata: ExtractedMetadata,
  fallbackDraft: EntryDraft
): Promise<EntryDraft | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: buildGeminiPrompt(input, metadata, fallbackDraft) }] },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                whatItSays: { type: "STRING" },
                relevanceToMe: { type: "STRING" },
                tags: { type: "ARRAY", items: { type: "STRING" } },
                coreBullets: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["title", "whatItSays", "relevanceToMe", "tags", "coreBullets"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini draft failed", response.status, await response.text());
      return null;
    }
    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return null;
    const parsed = JSON.parse(text) as Partial<EntryDraft>;
    return normalizeGeminiDraft(parsed, fallbackDraft);
  } catch (error) {
    console.error("Gemini draft failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildGeminiPrompt(
  input: CaptureInput,
  metadata: ExtractedMetadata,
  fallbackDraft: EntryDraft
): string {
  const myContext = input.myContext;
  return [
    "你是 LumiStudio 的材料整理助手。把用户刚收进来的东西整理成一条可在 PC 端继续确认的材料草稿。",
    "不要替用户做最终判断，不要编造原文没有的信息。可以生成保守摘要、标签和核心点，所有内容之后都由用户确认。",
    "relevanceToMe 只能保守描述「这条材料可能和用户的哪个项目/问题/已有判断相关、为什么」，不要把用户已有的判断或任何外部观点，当成用户对这条新材料已经下的结论直接写进去——那仍然需要用户自己在工作台确认。",
    "如果下面的项目/问题/判断信息和这条材料看不出明显关系，就不要硬扯关系，写清楚这条材料本身是什么即可。",
    "输出必须是 JSON，字段为 title, whatItSays, relevanceToMe, tags, coreBullets。",
    "",
    `用户输入：${input.rawInput}`,
    `用户当时为什么想收进来：${input.captureNote || "未填写"}`,
    `来源类型：${input.sourceType}`,
    `抓到的标题：${metadata.title || fallbackDraft.title}`,
    `抓到的站点：${metadata.siteName || ""}`,
    `抓到的描述：${metadata.description || ""}`,
    `抓到的正文片段：${metadata.textSnippet || ""}`,
    "",
    `用户当前在做的项目：${myContext?.currentProjects.join("；") || "未提供"}`,
    `用户长期关心的问题：${myContext?.activeQuestions.join("；") || "未提供"}`,
    `用户已有的判断（仅供参考用户关心什么，不代表用户对这条新材料的判断）：${myContext?.existingClaims.join("；") || "未提供"}`,
  ].join("\n");
}

function normalizeGeminiDraft(value: Partial<EntryDraft>, fallback: EntryDraft): EntryDraft {
  return {
    ...fallback,
    title: truncate(String(value.title || fallback.title), 120),
    whatItSays: truncate(String(value.whatItSays || fallback.whatItSays), 700),
    relevanceToMe: truncate(String(value.relevanceToMe || fallback.relevanceToMe), 360),
    tags: cleanList(value.tags, fallback.tags, 5, 24),
    coreBullets: cleanList(value.coreBullets, fallback.coreBullets, 4, 140),
  };
}

function cleanList(
  value: unknown,
  fallback: string[],
  maxItems: number,
  maxLength: number
): string[] {
  const list = Array.isArray(value) ? value : fallback;
  const cleaned = list
    .map((item) => truncate(String(item), maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : fallback;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function fetchPageMetadata(url: string, input: CaptureInput): Promise<ExtractedMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5",
        "user-agent":
          "Mozilla/5.0 (compatible; LumiStudio/0.1; +https://lumihelia.com)",
      },
    });

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || contentLength > MAX_PAGE_LENGTH) return { url };
    if (!contentType.includes("html") && !contentType.includes("text")) return { url };

    const html = (await response.text()).slice(0, MAX_PAGE_LENGTH);
    const finalUrl = response.url || url;
    const description =
      metaContent(html, ["og:description", "twitter:description", "description"]) ||
      textSnippet(html);

    return {
      url: finalUrl,
      title:
        metaContent(html, ["og:title", "twitter:title"]) ||
        titleContent(html) ||
        undefined,
      description: description ? truncate(description, 420) : undefined,
      siteName: metaContent(html, ["og:site_name", "application-name"]) || undefined,
      textSnippet: description ? undefined : truncate(textSnippet(html), 520),
      sourceType: inferSourceType(finalUrl, input.sourceType),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "::1" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function metaContent(html: string, names: string[]): string {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const name = attr(tag, "property") || attr(tag, "name");
    if (!name || !names.includes(name.toLowerCase())) continue;
    const content = attr(tag, "content");
    if (content) return decodeHtml(content);
  }
  return "";
}

function titleContent(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : "";
}

function textSnippet(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}
