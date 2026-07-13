import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchTranscript } from "youtube-transcript";
import { requireUser } from "./auth.js";
import {
  createDraftFromMetadata,
  extractFirstUrl,
  extractYouTubeVideoId,
  inferSourceType,
  parseSrtVtt,
  truncate,
  type CaptureInput,
  type CaptureMyContext,
  type EntryDraft,
  type ExtractedMetadata,
} from "../src/utils/extraction.js";

const MAX_TEXT_INPUT = 8000;
const MAX_FILE_CONTENT_CHARS = 20000;
const MAX_YOUTUBE_TRANSCRIPT_CHARS = 15000;
const MAX_PAGE_LENGTH = 900000;
const MAX_PDF_BASE64_BYTES = 7 * 1024 * 1024; // ~5MB decoded
const FETCH_TIMEOUT_MS = 6500;
const GEMINI_TIMEOUT_MS = 8000;
const VERIFY_TIMEOUT_MS = 6000;
const YOUTUBE_TIMEOUT_MS = 12000;

// Metadata fetch + Gemini draft + Gemini verification ≈ 20.5s worst case.
export const config = {
  maxDuration: 30,
};

// ---------------------------------------------------------------------------
// Parse result type
// ---------------------------------------------------------------------------

type ParseOk = { ok: true; input: CaptureInput };
type ParseErr = { ok: false; statusCode: number; error: string };
export type ParseResult = ParseOk | ParseErr;

// ---------------------------------------------------------------------------
// Vercel handler
// ---------------------------------------------------------------------------

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

  if (!(await requireUser(req, res))) return;

  const parseResult = await parseInputBody(req.body);
  if (!parseResult.ok) {
    res.status(parseResult.statusCode).json({ error: parseResult.error });
    return;
  }

  const { draft, mode } = await extractDraftForInput(parseResult.input);

  res.status(200).json({ draft, extraction: { mode } });
}

// ---------------------------------------------------------------------------
// parseInputBody — handles all three capture modes + legacy shape
// ---------------------------------------------------------------------------

export async function parseInputBody(body: unknown): Promise<ParseResult> {
  let parsed: Record<string, unknown>;
  try {
    parsed =
      typeof body === "string"
        ? (JSON.parse(body || "{}") as Record<string, unknown>)
        : (body as Record<string, unknown>);
  } catch {
    return { ok: false, statusCode: 400, error: "Invalid JSON" };
  }

  const rawMode = String(parsed.mode ?? "legacy");
  const myContext = sanitizeMyContext(parsed.myContext);

  // ── Mode: youtube ─────────────────────────────────────────────────────────
  if (rawMode === "youtube") {
    const url = String(parsed.url ?? "").trim().slice(0, 300);
    const captureNote = String(parsed.captureNote ?? "").slice(0, 1200);
    if (!url) return { ok: false, statusCode: 400, error: "Missing url" };

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return { ok: false, statusCode: 400, error: "Not a valid YouTube URL" };

    const result = await fetchYouTubeTranscript(videoId);
    if (!result) {
      return {
        ok: false,
        statusCode: 422,
        error: "no_transcript",
      };
    }

    const input: CaptureInput = {
      rawInput: truncate(result.text, MAX_YOUTUBE_TRANSCRIPT_CHARS),
      captureNote,
      sourceType: "video",
      myContext,
      _skipUrlFetch: true,
      _presetTitle: result.title,
    };
    return { ok: true, input };
  }

  // ── Mode: file ────────────────────────────────────────────────────────────
  if (rawMode === "file") {
    const fileType = String(parsed.fileType ?? "").toLowerCase();
    const fileContent = String(parsed.fileContent ?? "");
    const fileName = String(parsed.fileName ?? "").slice(0, 255);
    const captureNote = String(parsed.captureNote ?? "").slice(0, 1200);

    if (!["txt", "md", "pdf", "srt", "vtt"].includes(fileType)) {
      return { ok: false, statusCode: 400, error: "Unsupported file type" };
    }
    if (!fileContent) {
      return { ok: false, statusCode: 400, error: "Missing fileContent" };
    }

    let rawText: string;
    let sourceType: CaptureInput["sourceType"] = "article";

    if (fileType === "pdf") {
      if (fileContent.length > MAX_PDF_BASE64_BYTES) {
        return { ok: false, statusCode: 413, error: "file_too_large" };
      }
      const extracted = await parsePdfContent(fileContent);
      if (extracted === null) {
        return { ok: false, statusCode: 422, error: "parse_failed" };
      }
      rawText = truncate(extracted, MAX_FILE_CONTENT_CHARS);
    } else if (fileType === "srt" || fileType === "vtt") {
      rawText = truncate(parseSrtVtt(fileContent), MAX_FILE_CONTENT_CHARS);
      sourceType = "video";
    } else {
      // txt, md
      rawText = truncate(fileContent, MAX_FILE_CONTENT_CHARS);
    }

    if (!rawText.trim()) {
      return { ok: false, statusCode: 422, error: "parse_failed" };
    }

    const baseName = fileName.replace(/\.[^.]+$/, "").trim() || undefined;

    const input: CaptureInput = {
      rawInput: rawText,
      captureNote,
      sourceType,
      myContext,
      _skipUrlFetch: true,
      _presetTitle: baseName,
    };
    return { ok: true, input };
  }

  // ── Mode: text ────────────────────────────────────────────────────────────
  if (rawMode === "text") {
    const rawInput = String(parsed.rawInput ?? "").slice(0, MAX_TEXT_INPUT);
    const captureNote = String(parsed.captureNote ?? "").slice(0, 1200);
    if (!rawInput.trim() && !captureNote.trim()) {
      return { ok: false, statusCode: 400, error: "Empty input" };
    }
    const input: CaptureInput = {
      rawInput,
      captureNote,
      sourceType: "clue",
      myContext,
      _skipUrlFetch: true,
    };
    return { ok: true, input };
  }

  // ── Legacy shape (backward compat for vite.config.ts local middleware) ────
  const legacyInput = parsed as Partial<CaptureInput>;
  const rawInput = String(legacyInput.rawInput ?? "").slice(0, MAX_TEXT_INPUT);
  const captureNote = String(legacyInput.captureNote ?? "").slice(0, 1200);
  const sourceType = legacyInput.sourceType;

  if (!sourceType || !["article", "video", "podcast", "webpage", "clue"].includes(sourceType)) {
    return { ok: false, statusCode: 400, error: "Invalid capture payload" };
  }
  if (!rawInput.trim() && !captureNote.trim()) {
    return { ok: false, statusCode: 400, error: "Empty input" };
  }

  return {
    ok: true,
    input: {
      rawInput,
      captureNote,
      sourceType: sourceType as CaptureInput["sourceType"],
      myContext: sanitizeMyContext(legacyInput.myContext),
    },
  };
}

// ---------------------------------------------------------------------------
// extractDraftForInput — unchanged external shape, respects _skipUrlFetch
// ---------------------------------------------------------------------------

export async function extractDraftForInput(input: CaptureInput): Promise<{
  draft: EntryDraft;
  mode: "gemini" | "metadata" | "fallback";
}> {
  let metadata: ExtractedMetadata = {};
  let mode: "gemini" | "metadata" | "fallback" = "fallback";

  // Seed metadata from internal flags (file name / YouTube title)
  if (input._presetTitle) {
    metadata.title = input._presetTitle;
    mode = "metadata";
  }

  if (!input._skipUrlFetch) {
    const url = extractFirstUrl(input.rawInput);
    if (url && isSafeHttpUrl(url)) {
      try {
        const fetched = await fetchPageMetadata(url, input);
        metadata = { ...metadata, ...fetched };
        mode =
          fetched.description || fetched.textSnippet || fetched.title
            ? "metadata"
            : mode;
      } catch (error) {
        console.error("extract metadata failed", error);
      }
    }
  }

  let draft = createDraftFromMetadata(input, metadata);
  const geminiDraft = await draftWithGemini(input, metadata, draft);
  if (geminiDraft) {
    const verified = await verifyGeminiDraft(input, metadata, geminiDraft);
    if (verified) {
      draft = geminiDraft;
      mode = "gemini";
    } else {
      console.error("Gemini draft failed verification", {
        rawInput: input.rawInput.slice(0, 200),
      });
    }
  }

  draft.wasExtracted = mode !== "fallback";
  return { draft, mode };
}

// ---------------------------------------------------------------------------
// sanitizeMyContext (exported for vite.config.ts)
// ---------------------------------------------------------------------------

export function sanitizeMyContext(value: unknown): CaptureMyContext | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<CaptureMyContext>;
  const clean = (list: unknown): string[] =>
    Array.isArray(list)
      ? list
          .map((item) => String(item).slice(0, 200))
          .filter(Boolean)
          .slice(0, 12)
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

// ---------------------------------------------------------------------------
// YouTube transcript fetcher (no external package — scrapes timedtext URL)
// ---------------------------------------------------------------------------

async function fetchYouTubeTranscript(
  videoId: string
): Promise<{ text: string; title?: string } | null> {
  try {
    const transcript = await Promise.race([
      fetchTranscript(videoId),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Transcript timeout")), YOUTUBE_TIMEOUT_MS)),
    ]);
    const text = transcript.map((segment) => segment.text).join(" ").replace(/\s+/g, " ").trim();
    return text ? { text } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PDF text extraction (dynamic import avoids CJS/ESM type collision)
// ---------------------------------------------------------------------------

async function parsePdfContent(base64Content: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64Content, "base64");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    const text = result.text?.replace(/\s+/g, " ").trim() ?? "";
    return text || null;
  } catch (error) {
    console.error("pdf-parse failed", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini drafting
// ---------------------------------------------------------------------------

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
            {
              role: "user",
              parts: [{ text: buildGeminiPrompt(input, metadata, fallbackDraft) }],
            },
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
                retell: { type: "STRING" },
              },
              required: ["title", "whatItSays", "relevanceToMe", "tags", "coreBullets", "retell"],
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
  // Cap rawInput in the prompt to avoid very large prompts for documents/transcripts
  const rawInputForPrompt = input.rawInput.length > 4000
    ? `${input.rawInput.slice(0, 4000)}…（内容较长，已截取前4000字）`
    : input.rawInput;

  return [
    "你是 LumiStudio 的材料整理助手。把用户刚收进来的东西整理成一条可在 PC 端继续确认的材料草稿。",
    "不要替用户做最终判断，不要编造原文没有的信息。可以生成保守摘要、标签和核心点，所有内容之后都由用户确认。",
    "relevanceToMe 只能保守描述「这条材料可能和用户的哪个项目/问题/已有判断相关、为什么」，不要把用户已有的判断或任何外部观点，当成用户对这条新材料已经下的结论直接写进去——那仍然需要用户自己在工作台确认。",
    "如果下面的项目/问题/判断信息和这条材料看不出明显关系，就不要硬扯关系，写清楚这条材料本身是什么即可。",
    "retell 是用口语化、像跟朋友聊天一样的中文，把这条材料的内容重新讲一遍——不是 whatItSays 的同义改写，也不是 coreBullets 的罗列，而是换一种更轻松、更容易听懂的方式讲清楚它在说什么。必须基于材料本身的真实内容，不能编造材料里没有的信息，也不能只写空泛的客套话。",
    "输出必须是 JSON，字段为 title, whatItSays, relevanceToMe, tags, coreBullets, retell。",
    "",
    `用户输入内容：${rawInputForPrompt}`,
    `用户当时为什么想收进来：${input.captureNote || "未填写"}`,
    `来源类型：${input.sourceType}`,
    `已知标题（如有）：${metadata.title || input._presetTitle || fallbackDraft.title}`,
    `抓到的站点：${metadata.siteName || ""}`,
    `抓到的描述：${metadata.description || ""}`,
    "",
    `用户当前在做的项目：${myContext?.currentProjects.join("；") || "未提供"}`,
    `用户长期关心的问题：${myContext?.activeQuestions.join("；") || "未提供"}`,
    `用户已有的判断（仅供参考用户关心什么，不代表用户对这条新材料的判断）：${myContext?.existingClaims.join("；") || "未提供"}`,
  ].join("\n");
}

// Independent second pass — re-checks the draft against the original material.
async function verifyGeminiDraft(
  input: CaptureInput,
  metadata: ExtractedMetadata,
  draft: EntryDraft
): Promise<boolean> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return false;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

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
            {
              role: "user",
              parts: [{ text: buildVerificationPrompt(input, metadata, draft) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: { ok: { type: "BOOLEAN" } },
              required: ["ok"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini verification failed", response.status, await response.text());
      return false;
    }
    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return false;
    const parsed = JSON.parse(text) as { ok?: unknown };
    return parsed.ok === true;
  } catch (error) {
    console.error("Gemini verification failed", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function buildVerificationPrompt(
  input: CaptureInput,
  metadata: ExtractedMetadata,
  draft: EntryDraft
): string {
  const rawInputForPrompt = input.rawInput.slice(0, 3000);
  return [
    "你是 LumiStudio 的事实核查员，要独立检查另一次 AI 调用生成的材料草稿是否可信。不要重新生成草稿，只回答这份草稿能不能用。",
    "判断标准——草稿里的每一句话，是否都能在下面的原始材料里找到依据，没有编造原文没有的内容；retell 是否只是用口语重新讲了一遍材料本身，没有夹带原文没有的判断；relevanceToMe 是否只是保守地猜测相关性，没有把任何已有判断当成对这条新材料的确定结论。",
    "只要有一处明显编造或明显失实，就判定不可信。如果只是表达方式不同但内容忠实，判定可信。",
    "输出 JSON，字段为 ok（boolean）。",
    "",
    `原始材料——用户输入：${rawInputForPrompt}`,
    `原始材料——用户当时为什么想收进来：${input.captureNote || "未填写"}`,
    `原始材料——抓到的描述：${metadata.description || ""}`,
    `原始材料——抓到的正文片段：${metadata.textSnippet || ""}`,
    "",
    `待核查草稿——whatItSays：${draft.whatItSays}`,
    `待核查草稿——coreBullets：${draft.coreBullets.join("；")}`,
    `待核查草稿——retell：${draft.retell}`,
    `待核查草稿——relevanceToMe：${draft.relevanceToMe}`,
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
    retell: truncate(String(value.retell || fallback.retell), 600),
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

// ---------------------------------------------------------------------------
// Web page metadata fetch (used only in legacy/URL-containing cases)
// ---------------------------------------------------------------------------

async function fetchPageMetadata(url: string, input: CaptureInput): Promise<ExtractedMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5",
        "user-agent": "Mozilla/5.0 (compatible; LumiStudio/0.1; +https://lumihelia.com)",
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
