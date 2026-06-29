import type { SourceType } from "../data/types.js";
import { SOURCE_TYPE_LABEL } from "../data/types.js";

export interface CaptureMyContext {
  currentProjects: string[];
  activeQuestions: string[];
  existingClaims: string[];
}

export interface CaptureInput {
  rawInput: string;
  captureNote: string;
  sourceType: SourceType;
  myContext?: CaptureMyContext;
}

export interface ExtractedMetadata {
  url?: string;
  title?: string;
  description?: string;
  siteName?: string;
  textSnippet?: string;
  sourceType?: SourceType;
}

export interface EntryDraft {
  title: string;
  origin: string;
  captureNote: string;
  sourceType: SourceType;
  whatItSays: string;
  relevanceToMe: string;
  tags: string[];
  coreBullets: string[];
  retell: string;
  wasExtracted?: boolean;
  suggestedProjectTag?: string;
}

const URL_PATTERN = /https?:\/\/[^\s"'<>，。；、]+/i;

export function extractFirstUrl(value: string): string | null {
  const match = value.match(URL_PATTERN);
  return match?.[0] ?? null;
}

export function inferSourceType(value: string, selectedType: SourceType): SourceType {
  if (selectedType !== "clue") return selectedType;

  const normalized = value.toLowerCase();
  if (
    normalized.includes("youtube.com") ||
    normalized.includes("youtu.be") ||
    normalized.includes("bilibili.com") ||
    normalized.includes("vimeo.com")
  ) {
    return "video";
  }

  if (
    normalized.includes("podcast") ||
    normalized.includes("xiaoyuzhou") ||
    normalized.includes("spotify.com") ||
    normalized.includes("apple.com/podcast")
  ) {
    return "podcast";
  }

  if (extractFirstUrl(value)) return "webpage";
  return "clue";
}

export function createFallbackDraft(input: CaptureInput): EntryDraft {
  return createDraftFromMetadata(input, {});
}

export function createDraftFromMetadata(
  input: CaptureInput,
  metadata: ExtractedMetadata
): EntryDraft {
  const rawInput = cleanText(input.rawInput);
  const captureNote = cleanText(input.captureNote);
  const url = metadata.url ?? extractFirstUrl(rawInput);
  const sourceType = metadata.sourceType ?? inferSourceType(rawInput, input.sourceType);
  const title =
    cleanText(metadata.title ?? "") ||
    titleFromInput(rawInput, url) ||
    "还没起标题的一条材料";
  const siteName = cleanText(metadata.siteName ?? "") || hostnameFromUrl(url);
  const origin = url ?? (rawInput ? "用户输入线索" : "手机端收进来");
  const description = cleanText(metadata.description ?? "");
  const snippet = cleanText(metadata.textSnippet ?? "");
  const manualLine = rawInput && rawInput !== url ? rawInput.replace(url ?? "", "").trim() : "";

  const whatItSays =
    description ||
    snippet ||
    (manualLine
      ? `用户留下的原始线索：${truncate(manualLine, 220)}`
      : url
        ? "已经保留原始链接。页面正文需要在电脑端继续确认。"
        : "这条材料还只有一个线索，需要在电脑端继续捋清楚。");

  const suggestedProjectTag = suggestProjectTag(input.myContext, `${rawInput} ${captureNote}`);

  const relevanceToMe =
    captureNote ||
    (suggestedProjectTag
      ? `这条材料看起来可能和「${shortProjectName(suggestedProjectTag)}」有关，要不要接到这个项目？这只是建议，请在这里确认或改写。`
      : "这条材料还需要在工作台里确认和当前项目、判断之间的关系。");

  const coreBullets = [
    siteName ? `来源指向 ${siteName}` : "",
    whatItSays ? truncate(whatItSays, 140) : "",
    captureNote ? `用户当时觉得重要：${truncate(captureNote, 120)}` : "",
  ].filter(Boolean);

  return {
    title: truncate(title, 120),
    origin,
    captureNote,
    sourceType,
    whatItSays,
    relevanceToMe,
    tags: compactTags([SOURCE_TYPE_LABEL[sourceType], siteName]),
    coreBullets,
    retell: "",
    suggestedProjectTag,
  };
}

function shortProjectName(project: string): string {
  return project.split(/[:：]/)[0]?.trim() || project.trim();
}

function suggestProjectTag(myContext: CaptureMyContext | undefined, text: string): string | undefined {
  if (!myContext || !Array.isArray(myContext.currentProjects) || myContext.currentProjects.length === 0) {
    return undefined;
  }
  const haystack = text.toLowerCase();
  for (const project of myContext.currentProjects) {
    const shortName = shortProjectName(project);
    if (shortName.length >= 2 && haystack.includes(shortName.toLowerCase())) {
      return project;
    }
  }
  return undefined;
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncate(value: string, maxLength: number): string {
  const normalized = cleanText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function titleFromInput(rawInput: string, url: string | null | undefined): string {
  const withoutUrl = url ? rawInput.replace(url, "").trim() : rawInput;
  if (withoutUrl) {
    const firstSentence = withoutUrl.split(/[。！？\n]/)[0]?.trim();
    if (firstSentence) return firstSentence;
  }
  return hostnameFromUrl(url) || "";
}

function hostnameFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function compactTags(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter((value) => value.length > 0)
        .slice(0, 4)
    )
  );
}
