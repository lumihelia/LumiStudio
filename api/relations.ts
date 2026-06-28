import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildDeepSeekPrompt,
  normalizeDeepSeekRelations,
  sanitizeRelationEntries,
  type RelationCard,
  type RelationEntryInput,
} from "../src/utils/relations.js";
import { type CaptureMyContext } from "../src/utils/extraction.js";

const DEEPSEEK_TIMEOUT_MS = 20000;

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

  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid relations payload" });
    return;
  }

  const result = await computeRelations(body.topic, body.entries, body.myContext);
  res.status(200).json(result);
}

interface ParsedBody {
  topic: string;
  entries: RelationEntryInput[];
  myContext?: CaptureMyContext;
}

function parseBody(body: unknown): ParsedBody | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = typeof body === "string" ? JSON.parse(body || "{}") : ((body ?? {}) as Record<string, unknown>);
  } catch {
    return null;
  }

  const topic = String(parsed.topic ?? "").trim();
  const entries = sanitizeRelationEntries(parsed.entries);
  if (!topic || entries.length === 0) return null;

  const myContext = isCaptureMyContext(parsed.myContext) ? parsed.myContext : undefined;
  return { topic, entries, myContext };
}

function isCaptureMyContext(value: unknown): value is CaptureMyContext {
  if (!value || typeof value !== "object") return false;
  const raw = value as Partial<CaptureMyContext>;
  return (
    Array.isArray(raw.currentProjects) &&
    Array.isArray(raw.activeQuestions) &&
    Array.isArray(raw.existingClaims)
  );
}

export async function computeRelations(
  topic: string,
  entries: RelationEntryInput[],
  myContext: CaptureMyContext | undefined
): Promise<{ available: boolean; cards: RelationCard[] }> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return { available: false, cards: [] };
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const { system, user } = buildDeepSeekPrompt(topic, entries, myContext);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek relations call failed", response.status, await response.text());
      return { available: true, cards: [] };
    }

    const data = (await response.json()) as DeepSeekChatResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) return { available: true, cards: [] };

    const parsed = JSON.parse(text);
    return { available: true, cards: normalizeDeepSeekRelations(parsed, entries) };
  } catch (error) {
    console.error("DeepSeek relations call failed", error);
    return { available: true, cards: [] };
  } finally {
    clearTimeout(timeout);
  }
}

interface DeepSeekChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}
