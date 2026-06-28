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
  };
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
