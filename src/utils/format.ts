import type { Entry } from "../data/types";
import { SOURCE_TYPE_LABEL } from "../data/types";

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
  const relations: AgentRelation[] = entry.projectTag
    ? allPublicEntries
        .filter((e) => e.id !== entry.id && e.projectTag === entry.projectTag)
        .map((e) => ({ type: "relates" as const, to: e.title }))
    : [];

  return {
    object_type: "material",
    title: entry.title,
    source: entry.origin,
    source_type: entry.sourceType,
    visibility: "public",
    summary: entry.whatItSays,
    author_note: entry.relevanceToMe,
    claims: entry.judgmentStatement ? [entry.judgmentStatement] : [],
    questions: [],
    related_topics: entry.tags,
    relations,
    status: entry.status,
    updated_at: entry.processedAt,
    markdown_url: `/agent?format=markdown#${entry.id}`,
    json_url: `/agent?format=json#${entry.id}`,
    objects: compactAgentObjects([
      { object_type: "material", text: entry.origin, status: entry.status },
      entry.captureNote
        ? { object_type: "thought", text: entry.captureNote, status: "user-authored" }
        : null,
      entry.whatItSays
        ? { object_type: "interpretation", text: entry.whatItSays, status: "draft" }
        : null,
      entry.relevanceToMe
        ? { object_type: "author_note", text: entry.relevanceToMe, status: "user-confirmed" }
        : null,
      entry.judgmentStatement
        ? { object_type: "claim", text: entry.judgmentStatement, status: "public" }
        : null,
      entry.nextAction
        ? { object_type: "action", text: entry.nextAction, status: "next" }
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
      const lines = [
        `## ${entry.title}`,
        "",
        `> ${entry.judgmentStatement}`,
        "",
        entry.relevanceToMe,
        "",
      ];
      if (entry.whatItSays) {
        lines.push("**这篇讲了什么**", "", entry.whatItSays, "");
      }
      if (entry.coreBullets.length > 0) {
        lines.push("**核心观点**", "", ...entry.coreBullets.map((b) => `- ${b}`), "");
      }
      if (entry.tags.length > 0) {
        lines.push(`标签：${entry.tags.join("、")}`, "");
      }
      lines.push(
        `来源：${SOURCE_TYPE_LABEL[entry.sourceType]} · ${entry.origin}${
          entry.projectTag ? ` · ${entry.projectTag}` : ""
        } · ${formatDate(entry.processedAt)}`
      );
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

export function toFeedMock(entries: Entry[]): string {
  return JSON.stringify(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: "LumiStudio Public Feed",
      home_page_url: "/public",
      feed_url: "/api/agent?format=feed",
      items: entries.map((entry) => ({
        id: entry.id,
        url: `/public#${entry.id}`,
        title: entry.title,
        content_text: [entry.judgmentStatement, entry.whatItSays, entry.relevanceToMe]
          .filter(Boolean)
          .join("\n\n"),
        tags: entry.tags,
        date_modified: entry.processedAt ?? entry.capturedAt,
        external_url: entry.origin.startsWith("http") ? entry.origin : undefined,
      })),
    },
    null,
    2
  );
}
