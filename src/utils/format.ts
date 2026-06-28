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

export interface AgentEntry {
  title: string;
  sourceType: string;
  origin: string;
  judgmentStatement: string;
  relevanceToMe: string;
  projectTag: string | null;
  processedAt: string | null;
}

export function toAgentShape(entry: Entry): AgentEntry {
  return {
    title: entry.title,
    sourceType: entry.sourceType,
    origin: entry.origin,
    judgmentStatement: entry.judgmentStatement,
    relevanceToMe: entry.relevanceToMe,
    projectTag: entry.projectTag,
    processedAt: entry.processedAt,
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
        `来源：${SOURCE_TYPE_LABEL[entry.sourceType]} · ${entry.origin}${
          entry.projectTag ? ` · ${entry.projectTag}` : ""
        } · ${formatDate(entry.processedAt)}`,
      ];
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
