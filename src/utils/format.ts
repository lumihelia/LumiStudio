import type { Entry } from "../data/types.js";
import { SOURCE_TYPE_LABEL } from "../data/types.js";

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "刚刚";
  if (diffHours < 24) return `${diffHours} 小时前`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} 天前`;
}

export interface PublicView {
  title: string;
  origin: string;
  sourceType: Entry["sourceType"];
  tags: string[];
  coreBullets: string[];
  projectTag: string | null;
  capturedAt: string;
  processedAt: string | null;
  whatItSays: string | null;
  retell: string | null;
  judgmentStatement: string | null;
  captureNote: string | null;
  relevanceToMe: string | null;
}

// The single allowlist every public-facing renderer (PublicPage, the agent
// feed formats, AgentOutputPage) must go through. captureNote/relevanceToMe
// only surface when the user has explicitly opted that field into public —
// writing something there does not make it public by itself.
export function toPublicView(entry: Entry): PublicView {
  return {
    title: entry.title,
    origin: entry.origin,
    sourceType: entry.sourceType,
    tags: entry.tags,
    coreBullets: entry.coreBullets,
    projectTag: entry.projectTag,
    capturedAt: entry.capturedAt,
    processedAt: entry.processedAt,
    whatItSays: entry.whatItSays || null,
    retell: entry.retell || null,
    judgmentStatement: entry.judgmentStatement || null,
    captureNote: entry.publishCaptureNote && entry.captureNote ? entry.captureNote : null,
    relevanceToMe: entry.publishRelevanceToMe && entry.relevanceToMe ? entry.relevanceToMe : null,
  };
}

export interface AgentRelation {
  type: "relates";
  to: string;
}

export interface AgentObject {
  object_type:
    | "material"
    | "thought"
    | "interpretation"
    | "author_note"
    | "claim"
    | "question"
    | "tension"
    | "relation"
    | "action";
  text: string;
  status?: string;
}

export interface AgentEntry {
  object_type: "material";
  title: string;
  source: string;
  source_type: string;
  visibility: "public";
  summary: string;
  author_note: string;
  claims: string[];
  questions: string[];
  related_topics: string[];
  relations: AgentRelation[];
  status: string;
  updated_at: string | null;
  markdown_url: string;
  json_url: string;
  objects: AgentObject[];
}

export function toAgentShape(entry: Entry, allPublicEntries: Entry[]): AgentEntry {
  const view = toPublicView(entry);
  const relations: AgentRelation[] = view.projectTag
    ? allPublicEntries
        .filter((e) => e.id !== entry.id && e.projectTag === view.projectTag)
        .map((e) => ({ type: "relates" as const, to: e.title }))
    : [];

  return {
    object_type: "material",
    title: view.title,
    source: view.origin,
    source_type: view.sourceType,
    visibility: "public",
    summary: view.whatItSays ?? "",
    author_note: view.relevanceToMe ?? "",
    claims: view.judgmentStatement ? [view.judgmentStatement] : [],
    questions: [],
    related_topics: view.tags,
    relations,
    status: entry.status,
    updated_at: view.processedAt,
    markdown_url: `/agent?format=markdown#${entry.id}`,
    json_url: `/agent?format=json#${entry.id}`,
    objects: compactAgentObjects([
      { object_type: "material", text: view.origin, status: entry.status },
      view.captureNote
        ? { object_type: "thought", text: view.captureNote, status: "user-authored" }
        : null,
      view.whatItSays
        ? { object_type: "interpretation", text: view.whatItSays, status: "draft" }
        : null,
      view.relevanceToMe
        ? { object_type: "author_note", text: view.relevanceToMe, status: "user-confirmed" }
        : null,
      view.judgmentStatement
        ? { object_type: "claim", text: view.judgmentStatement, status: "public" }
        : null,
    ]),
  };
}

function compactAgentObjects(objects: Array<AgentObject | null>): AgentObject[] {
  return objects.filter((object): object is AgentObject => Boolean(object));
}

export function toMarkdown(entries: Entry[]): string {
  if (entries.length === 0) {
    return "<!-- 还没有公开的条目 -->";
  }
  return entries
    .map((entry) => {
      const view = toPublicView(entry);
      const lines = [`## ${view.title}`, ""];
      if (view.judgmentStatement) {
        lines.push(`> ${view.judgmentStatement}`, "");
      }
      if (view.whatItSays) {
        lines.push("**这篇讲了什么**", "", view.whatItSays, "");
      }
      if (view.coreBullets.length > 0) {
        lines.push("**核心观点**", "", ...view.coreBullets.map((b) => `- ${b}`), "");
      }
      if (view.retell) {
        lines.push("**复述**", "", view.retell, "");
      }
      if (view.relevanceToMe) {
        lines.push("**这和我的关系**", "", view.relevanceToMe, "");
      }
      if (view.captureNote) {
        lines.push("**作者附注**", "", view.captureNote, "");
      }
      if (view.tags.length > 0) {
        lines.push(`标签：${view.tags.join("、")}`, "");
      }
      lines.push(
        `来源：${SOURCE_TYPE_LABEL[view.sourceType]} · ${view.origin}${
          view.projectTag ? ` · ${view.projectTag}` : ""
        } · ${formatDate(view.processedAt)}`
      );
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

const SITE_URL = "https://studio.lumihelia.com";

export function toRssFeed(entries: Entry[]): string {
  const items = entries
    .map((entry) => {
      const view = toPublicView(entry);
      const description = [view.judgmentStatement, view.whatItSays, view.retell]
        .filter(Boolean)
        .join("\n\n");
      const pubDate = new Date(view.processedAt ?? view.capturedAt).toUTCString();
      return [
        "<item>",
        `<title>${escapeXml(view.title)}</title>`,
        `<link>${escapeXml(SITE_URL)}/public</link>`,
        `<guid isPermaLink="false">${escapeXml(entry.id)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${escapeXml(description || "这条公开对象还没有形成摘要。")}</description>`,
        ...view.tags.map((tag) => `<category>${escapeXml(tag)}</category>`),
        "</item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    "<title>LumiStudio Public Feed</title>",
    `<link>${SITE_URL}/public</link>`,
    "<description>LumiStudio 公开页的最新知识更新流。</description>",
    "<language>zh-CN</language>",
    items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
