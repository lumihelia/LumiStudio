export type SourceType = "article" | "video" | "podcast" | "webpage" | "clue";

export type LifecycleStatus =
  | "captured"
  | "extracted"
  | "reviewed"
  | "parked"
  | "published"
  | "discarded";

export interface Entry {
  id: string;
  sourceType: SourceType;
  title: string;
  origin: string;
  captureNote: string;
  whatItSays: string;
  relevanceToMe: string;
  projectTag: string | null;
  judgmentStatement: string;
  nextAction: string;
  status: LifecycleStatus;
  isPublic: boolean;
  capturedAt: string;
  processedAt: string | null;
  tags: string[];
  coreBullets: string[];
  retell: string;
  publishCaptureNote: boolean;
  publishRelevanceToMe: boolean;
}

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  article: "文章",
  video: "视频",
  podcast: "播客",
  webpage: "网页",
  clue: "线索",
};

export const STATUS_LABEL: Record<LifecycleStatus, string> = {
  captured: "刚收进来，还没处理",
  extracted: "系统已解析出内容",
  reviewed: "人类已编辑确认",
  parked: "先放着了",
  published: "已经放到公开页",
  discarded: "已从界面移除",
};

export const STATUS_SHORT_LABEL: Record<LifecycleStatus, string> = {
  captured: "待捋",
  extracted: "已解析",
  reviewed: "已确认",
  parked: "先放着",
  published: "已公开",
  discarded: "已移除",
};

export function isPublishedEntry(entry: Entry): boolean {
  return entry.status !== "discarded" && (entry.status === "published" || entry.isPublic === true);
}
