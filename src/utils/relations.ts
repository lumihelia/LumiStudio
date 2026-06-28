import type { CaptureMyContext } from "./extraction.js";

export type RelationKind = "相似的想法" | "支撑它的材料" | "冲突 / 张力" | "延伸出去的问题";

export interface RelationEntryInput {
  id: string;
  title: string;
  sourceType: string;
  whatItSays: string;
  relevanceToMe: string;
  judgmentStatement: string;
  captureNote: string;
  tags: string[];
  projectTag: string | null;
  status: string;
}

export interface RelationsRequest {
  topic: string;
  entries: RelationEntryInput[];
  myContext?: CaptureMyContext;
}

export interface RelationCard {
  id: string;
  kind: RelationKind;
  title: string;
  description: string;
  meta: string;
  entryId?: string;
}

export interface RelationsResult {
  available: boolean;
  cards: RelationCard[];
}

const MAX_ENTRIES = 8;
const MAX_TEXT_LENGTH = 280;

export function sanitizeRelationEntries(entries: unknown): RelationEntryInput[] {
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, MAX_ENTRIES).map((value) => {
    const raw = (value ?? {}) as Partial<RelationEntryInput>;
    return {
      id: String(raw.id ?? ""),
      title: truncate(String(raw.title ?? "")),
      sourceType: String(raw.sourceType ?? ""),
      whatItSays: truncate(String(raw.whatItSays ?? "")),
      relevanceToMe: truncate(String(raw.relevanceToMe ?? "")),
      judgmentStatement: truncate(String(raw.judgmentStatement ?? "")),
      captureNote: truncate(String(raw.captureNote ?? "")),
      tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 6) : [],
      projectTag: raw.projectTag ? String(raw.projectTag) : null,
      status: String(raw.status ?? ""),
    };
  });
}

function truncate(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= MAX_TEXT_LENGTH
    ? normalized
    : `${normalized.slice(0, MAX_TEXT_LENGTH - 1)}…`;
}

// Honest fallback when DeepSeek isn't configured (or the call fails): no
// fabricated "vs" tensions, no generic question templates - just an honest
// grouping with a label that says exactly what it is.
export function buildHonestFallback(entries: RelationEntryInput[]): RelationCard[] {
  return entries.map((entry) => ({
    id: `group-${entry.id}`,
    kind: "相似的想法" as const,
    title: entry.title,
    description: entry.relevanceToMe || entry.captureNote || "和当前主题共享同一个标签或项目。",
    meta: `同标签/同项目 · 还没有 AI 判断`,
    entryId: entry.id,
  }));
}

export function buildDeepSeekPrompt(
  topic: string,
  entries: RelationEntryInput[],
  myContext: CaptureMyContext | undefined
): { system: string; user: string } {
  const system = [
    "你是 LumiStudio 的引力台关系判断助手。任务是从一组材料里找出真实存在的关系，不是把每条材料都塞进每个分类。",
    "只输出 JSON，不要输出任何解释性文字。",
    "JSON 结构：",
    '{"similar": [{"entryId": "...", "reason": "..."}], "supporting": [{"entryId": "...", "reason": "..."}], "tensions": [{"entryId": "...", "reason": "...", "against": "..."}], "questions": [{"title": "...", "reason": "..."}]}',
    "规则：",
    "1. similar：只有内容上真的呼应同一个想法/角度的材料才放进来，reason 要引用材料本身的具体内容，不能只是因为标签相同。",
    "2. supporting：只有真的为某个判断提供证据支撑的材料才放进来。",
    "3. tensions：只有真的能看出对立、矛盾或需要用户做边界判断的情况才放进来；against 写清楚它和什么（另一条材料，或下面用户已有判断里的某一条）形成张力。如果看不出真实冲突，tensions 就是空数组，不要为了填满而编造一个'vs'。",
    "4. questions：只能是从材料本身或用户长期关心的问题里真实浮现出来的开放问题，不能是和材料无关的通用问题。如果没有，questions 就是空数组。",
    "5. 任何分类都可以是空数组——这是被允许的、诚实的结果，比硬塞内容更好。",
    "6. 不要把用户已有的判断或外部观点，当成对这批新材料已经确认的结论——这些都只是待用户确认的 AI 建议。",
  ].join("\n");

  const user = [
    `当前主题：${topic}`,
    "",
    "材料列表：",
    ...entries.map(
      (entry, index) =>
        `[${index + 1}] id=${entry.id} 标题=${entry.title} 类型=${entry.sourceType} 标签=${entry.tags.join("、") || "无"}\n` +
        `它讲了什么：${entry.whatItSays || "未填写"}\n` +
        `和用户的关系：${entry.relevanceToMe || "未填写"}\n` +
        `用户的判断：${entry.judgmentStatement || "未填写"}\n` +
        `用户当时的想法：${entry.captureNote || "未填写"}`
    ),
    "",
    `用户当前在做的项目：${myContext?.currentProjects.join("；") || "未提供"}`,
    `用户长期关心的问题：${myContext?.activeQuestions.join("；") || "未提供"}`,
    `用户已有的判断：${myContext?.existingClaims.join("；") || "未提供"}`,
  ].join("\n");

  return { system, user };
}

interface DeepSeekRelationResponse {
  similar?: Array<{ entryId?: string; reason?: string }>;
  supporting?: Array<{ entryId?: string; reason?: string }>;
  tensions?: Array<{ entryId?: string; reason?: string; against?: string }>;
  questions?: Array<{ title?: string; reason?: string }>;
}

export function normalizeDeepSeekRelations(
  raw: unknown,
  entries: RelationEntryInput[]
): RelationCard[] {
  const parsed = (raw ?? {}) as DeepSeekRelationResponse;
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  const similar = (parsed.similar ?? [])
    .filter((item) => item.entryId && entryById.has(item.entryId))
    .map((item) => {
      const entry = entryById.get(item.entryId!)!;
      return {
        id: `similar-${entry.id}`,
        kind: "相似的想法" as const,
        title: entry.title,
        description: item.reason || "和当前主题有相似线索。",
        meta: entry.tags[0] || entry.projectTag || "材料",
        entryId: entry.id,
      };
    });

  const supporting = (parsed.supporting ?? [])
    .filter((item) => item.entryId && entryById.has(item.entryId))
    .map((item) => {
      const entry = entryById.get(item.entryId!)!;
      return {
        id: `support-${entry.id}`,
        kind: "支撑它的材料" as const,
        title: entry.title,
        description: item.reason || "可以作为这个主题的材料证据。",
        meta: entry.sourceType,
        entryId: entry.id,
      };
    });

  const tensions = (parsed.tensions ?? [])
    .filter((item) => item.entryId && entryById.has(item.entryId))
    .map((item) => {
      const entry = entryById.get(item.entryId!)!;
      return {
        id: `tension-${entry.id}`,
        kind: "冲突 / 张力" as const,
        title: item.against ? `${entry.title.slice(0, 16)} vs ${item.against.slice(0, 16)}` : entry.title,
        description: item.reason || "这里可能需要用户决定边界，而不是让 agent 自动吸收。",
        meta: "AI 建议 · 待确认",
        entryId: entry.id,
      };
    });

  const questions = (parsed.questions ?? [])
    .filter((item) => item.title)
    .map((item, index) => ({
      id: `question-${index}-${item.title}`,
      kind: "延伸出去的问题" as const,
      title: item.title!,
      description: item.reason || "",
      meta: "AI 建议 · 待探索",
    }));

  return [...similar, ...supporting, ...tensions, ...questions];
}
