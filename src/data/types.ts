export type SourceType = "article" | "video" | "podcast" | "webpage" | "clue";

export type LifecycleStatus = "captured" | "parked" | "connected" | "published" | "discarded";

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
}

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  article: "文章",
  video: "视频",
  podcast: "播客",
  webpage: "网页",
  clue: "线索",
};

export const KNOWN_PROJECTS = ["LumiStudio 产品阅读", "组织设计研究", "城市观察笔记"];

export const STATUS_LABEL: Record<LifecycleStatus, string> = {
  captured: "刚收进来，还没处理",
  parked: "先放着了",
  connected: "连接到项目里了",
  published: "已经放到公开页",
  discarded: "已从界面移除",
};
