import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { useAppState } from "../state/useAppState";
import { isPublishedEntry } from "../data/types";
import { formatRelative, toPublicView } from "../utils/format";
import styles from "./AgentOutputPage.module.css";

type FeedFilter = "全部更新" | "我的订阅" | "来自关注" | "系统推荐";
type ObjectType = "author_note" | "claim" | "interpretation" | "question" | "method" | "update";

interface FeedItem {
  id: string;
  type: ObjectType;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  updatedAt: string;
}

const FILTERS: FeedFilter[] = ["全部更新", "我的订阅", "来自关注", "系统推荐"];

const TYPE_LABEL: Record<ObjectType, string> = {
  author_note: "作者笔记",
  claim: "主张",
  interpretation: "解读",
  question: "问题",
  method: "方法",
  update: "更新",
};

export function AgentOutputPage() {
  const { entries } = useAppState();
  const [filter, setFilter] = useState<FeedFilter>("全部更新");
  const publicEntries = useMemo(() => entries.filter(isPublishedEntry), [entries]);
  const feedItems = useMemo(() => buildFeedItems(publicEntries), [publicEntries]);
  const topics = useMemo(() => buildTopics(publicEntries), [publicEntries]);
  const typeCounts = useMemo(() => buildTypeCounts(feedItems), [feedItems]);

  return (
    <div className={styles.shell}>
      <aside className={styles.feedSidebar} aria-label="订阅源">
        <section>
          <h2>订阅源</h2>
          <div className={styles.filterList}>
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                className={item === filter ? `${styles.filterItem} ${styles.filterItemActive}` : styles.filterItem}
                onClick={() => setFilter(item)}
              >
                <span>{item}</span>
                <small>{countForFilter(item, feedItems.length, topics.length)}</small>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.sidebarSection}>
          <h2>主题</h2>
          <div className={styles.topicList}>
            {topics.slice(0, 8).map((topic) => (
              <div key={topic.name} className={styles.topicRow}>
                <span>{topic.name}</span>
                <small>{topic.count}</small>
              </div>
            ))}
            {topics.length === 0 && <p className={styles.mutedText}>暂无主题。</p>}
          </div>
        </section>

        <section className={styles.sidebarSection}>
          <h2>类型</h2>
          <div className={styles.typeList}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className={styles.typeRow}>
                <span>{type}</span>
                <small>{TYPE_LABEL[type as ObjectType]} · {count}</small>
              </div>
            ))}
          </div>
        </section>

        <Link to="/settings" className={styles.contextCard}>
          <strong>我的上下文</strong>
          <span>判断上下文 / 设置</span>
        </Link>
      </aside>

      <main className={styles.feedPane} aria-label="全部更新">
        <div className={styles.feedHeader}>
          <div>
            <h1>{filter}</h1>
            <p>来自 LumiStudio 公开页的最新知识更新流。</p>
          </div>
          <div className={styles.sortTools}>
            <button type="button">最新优先</button>
            <span className={styles.filterIcon} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.feedList}>
          {feedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>Feed 还没有内容</h2>
              <p>把至少一条材料放到公开页后，这里会出现可订阅、可被 agents 读取的更新流。</p>
            </div>
          ) : (
            feedItems.map((item) => <FeedCard key={item.id} item={item} />)
          )}
        </div>
      </main>

      <aside className={styles.feedInfoPane} aria-label="Feed 说明">
        <InfoPanel title="Feed 说明">
          <p>
            这是 LumiStudio 公开更新流，汇集来自所有公开页的知识对象与更新动态。可被人类阅读，也可被 Agents 稳定消费。
          </p>
          <a href="/api/agent?format=feed">了解 Feed 协议 →</a>
        </InfoPanel>

        <InfoPanel title="导出与订阅">
          <p>将 Feed 导出为结构化格式，或订阅实时更新。</p>
          <div className={styles.exportGrid}>
            <a href="/api/agent?format=feed">RSS 订阅</a>
            <a href="/api/agent?format=json">JSON Feed</a>
            <a href="/api/agent?format=markdown">导出 Markdown</a>
          </div>
          <a href="/api/agent?format=json">查看 Feed 规范 →</a>
        </InfoPanel>

        <InfoPanel title="可读对象统计" meta="最近 30 天">
          <div className={styles.statsGrid}>
            <Stat value={feedItems.length} label="所有更新" />
            <Stat value={typeCounts.claim} label="主张 claims" />
            <Stat value={typeCounts.author_note} label="作者笔记 notes" />
            <Stat value={typeCounts.interpretation} label="解读 interpretations" />
            <Stat value={typeCounts.question} label="问题 questions" />
            <Stat value={typeCounts.method} label="方法更新 methods" />
          </div>
          <a href="/api/agent?format=json">查看统计详情 →</a>
        </InfoPanel>

        <InfoPanel title="今日更新">
          <p>24 小时内新增 {recentItems(feedItems).length} 条更新</p>
          <ul className={styles.todayList}>
            {recentItems(feedItems).slice(0, 4).map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <small>{formatRelative(item.updatedAt)}</small>
              </li>
            ))}
            {recentItems(feedItems).length === 0 && <li>暂无今日更新</li>}
          </ul>
        </InfoPanel>

        <InfoPanel title="推荐订阅">
          <p>发现值得关注的主题与来源。</p>
          <div className={styles.subscribeList}>
            {topics.slice(0, 2).map((topic) => (
              <div key={topic.name}>
                <span>{topic.name}</span>
                <button type="button">+ 订阅</button>
              </div>
            ))}
            {topics.length === 0 && <p className={styles.mutedText}>暂无推荐。</p>}
          </div>
        </InfoPanel>
      </aside>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <article className={styles.feedCard}>
      <div className={styles.feedIcon} aria-hidden="true">
        {item.type.slice(0, 1)}
      </div>
      <div className={styles.feedCardBody}>
        <span className={styles.objectChip}>{item.type}</span>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
        <div className={styles.tagLine}>
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag}># {tag}</span>
          ))}
        </div>
        <div className={styles.feedMeta}>
          <span>来源 {item.source}</span>
          <span>更新 {formatRelative(item.updatedAt)}</span>
          <span>可读对象</span>
          <span>人类 · Agent</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button type="button" aria-label="保留">[]</button>
        <button type="button" aria-label="更多操作">...</button>
        <a href="/public">查看公开页 ↗</a>
        <a href="/api/agent?format=json">查看 JSON</a>
        <button type="button">复制链接</button>
      </div>
    </article>
  );
}

function InfoPanel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.infoPanel}>
      <div className={styles.infoPanelHeader}>
        <h3>{title}</h3>
        {meta && <span>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.stat}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function buildFeedItems(entries: Entry[]): FeedItem[] {
  return entries
    .flatMap((entry) => {
      const view = toPublicView(entry);
      const updatedAt = view.processedAt ?? view.capturedAt;
      const tags = view.tags.length > 0 ? view.tags : [view.projectTag ?? "公开对象"];
      const items: FeedItem[] = [];

      if (view.relevanceToMe || view.captureNote) {
        items.push({
          id: `${entry.id}-author-note`,
          type: "author_note",
          title: view.title,
          summary: (view.relevanceToMe || view.captureNote) as string,
          tags,
          source: view.origin || "LumiStudio Blog",
          updatedAt,
        });
      }

      if (view.judgmentStatement) {
        items.push({
          id: `${entry.id}-claim`,
          type: "claim",
          title: view.title,
          summary: view.judgmentStatement,
          tags,
          source: view.origin || "LumiStudio Blog",
          updatedAt,
        });
      }

      if (view.whatItSays) {
        items.push({
          id: `${entry.id}-interpretation`,
          type: "interpretation",
          title: view.title,
          summary: view.whatItSays,
          tags,
          source: view.origin || "LumiStudio Blog",
          updatedAt,
        });
      }

      if (entry.nextAction) {
        items.push({
          id: `${entry.id}-method`,
          type: "method",
          title: `${view.projectTag || "项目"} 实践指南`,
          summary: entry.nextAction,
          tags,
          source: "Agent 实验室",
          updatedAt,
        });
      }

      return items;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function buildTopics(entries: Entry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const tags = entry.tags.length > 0 ? entry.tags : [entry.projectTag ?? "公开对象"];
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function buildTypeCounts(items: FeedItem[]): Record<ObjectType, number> {
  return {
    author_note: items.filter((item) => item.type === "author_note").length,
    claim: items.filter((item) => item.type === "claim").length,
    interpretation: items.filter((item) => item.type === "interpretation").length,
    question: items.filter((item) => item.type === "question").length,
    method: items.filter((item) => item.type === "method").length,
    update: items.filter((item) => item.type === "update").length,
  };
}

function countForFilter(filter: FeedFilter, total: number, topicCount: number): number {
  if (filter === "全部更新") return total;
  if (filter === "我的订阅") return topicCount;
  if (filter === "来自关注") return 0;
  return topicCount;
}

function recentItems(items: FeedItem[]): FeedItem[] {
  const oneDay = 24 * 60 * 60 * 1000;
  return items.filter((item) => Date.now() - new Date(item.updatedAt).getTime() <= oneDay);
}
