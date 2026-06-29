import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { SOURCE_TYPE_LABEL, isPublishedEntry } from "../data/types";
import { useAppState } from "../state/useAppState";
import { formatDate, toPublicView } from "../utils/format";
import type { PublicView } from "../utils/format";
import styles from "./PublicPage.module.css";

export function PublicPage() {
  const { entries } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const publicEntries = useMemo(() => {
    return entries
      .filter(isPublishedEntry)
      .sort(
        (a, b) =>
          new Date(b.processedAt ?? b.capturedAt).getTime() -
          new Date(a.processedAt ?? a.capturedAt).getTime()
      );
  }, [entries]);

  const selectedEntry =
    publicEntries.find((entry) => entry.id === selectedId) ?? publicEntries[0] ?? null;
  const view = useMemo(() => (selectedEntry ? toPublicView(selectedEntry) : null), [selectedEntry]);

  useEffect(() => {
    if (publicEntries.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !publicEntries.some((entry) => entry.id === selectedId)) {
      setSelectedId(publicEntries[0].id);
    }
  }, [publicEntries, selectedId]);

  const related = selectedEntry
    ? entries.filter((entry) => {
        if (entry.id === selectedEntry.id) return false;
        if (selectedEntry.projectTag && entry.projectTag === selectedEntry.projectTag) return true;
        return entry.tags.some((tag) => selectedEntry.tags.includes(tag));
      })
    : [];

  const topics = buildTopicCounts(publicEntries);

  return (
    <div className={styles.shell}>
      <aside className={styles.publicListPane} aria-label="最近公开">
        <section>
          <div className={styles.paneHeader}>
            <div>
              <h2>最近公开</h2>
              <span>{publicEntries.length}</span>
            </div>
            <span className={styles.filterIcon} aria-hidden="true" />
          </div>

          <div className={styles.publicList}>
            {publicEntries.length === 0 ? (
              <div className={styles.emptyState}>
                <p>还没有公开内容。</p>
                <span>在工作台写成判断后，再放到公开页。</span>
              </div>
            ) : (
              publicEntries.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={
                    entry.id === selectedEntry?.id
                      ? `${styles.publicListItem} ${styles.publicListItemActive}`
                      : styles.publicListItem
                  }
                  onClick={() => setSelectedId(entry.id)}
                >
                  <strong>{entry.title}</strong>
                  <span>{formatDate(entry.processedAt ?? entry.capturedAt)}</span>
                  <small>已发布</small>
                </button>
              ))
            )}
          </div>
        </section>

        <section className={styles.topicSection}>
          <div className={styles.sectionHeader}>
            <h2>主题</h2>
            <span>{topics.length}</span>
          </div>
          <div className={styles.topicList}>
            {topics.map((topic) => (
              <div key={topic.name} className={styles.topicRow}>
                <span>{topic.name}</span>
                <small>{topic.count}</small>
              </div>
            ))}
            {topics.length === 0 && <p className={styles.mutedText}>暂无主题。</p>}
          </div>
        </section>

        <Link to="/settings" className={styles.contextCard}>
          <strong>我的上下文</strong>
          <span>判断上下文 / 设置</span>
        </Link>
      </aside>

      <main className={styles.readingPane} aria-label="公开阅读页">
        {!selectedEntry || !view ? (
          <div className={styles.readingEmpty}>
            <h1>公开页还空着</h1>
            <p>公开页只展示已经由用户确认、可以给人和 agents 读取的对象。</p>
          </div>
        ) : (
          <article className={styles.article}>
            <div className={styles.breadcrumb}>公开页 / {view.projectTag || "知识对象"}</div>
            <div className={styles.articleTools}>
              <button type="button" aria-label="收藏">[]</button>
              <button type="button" aria-label="更多操作">...</button>
            </div>
            <h1>{view.title}</h1>
            <div className={styles.metaLine}>
              <span>来源：{view.origin || SOURCE_TYPE_LABEL[view.sourceType]}</span>
              <span>作者：用户确认</span>
              <span>标签：{displayTags(selectedEntry).join(" / ")}</span>
              <span>更新时间：{formatDate(view.processedAt ?? view.capturedAt)}</span>
            </div>

            {view.judgmentStatement && <p className={styles.lead}>{view.judgmentStatement}</p>}

            {buildArticleSections(view).map((section, index) => (
              <ArticleSection key={section.title} number={`${index + 1}.`} title={section.title}>
                {section.body}
              </ArticleSection>
            ))}

            <section className={styles.relatedBox}>
              <div className={styles.relatedHeader}>
                <h2>这篇还牵到了什么</h2>
                <Link to="/gravity">查看全部关联 →</Link>
              </div>
              <div className={styles.relatedGrid}>
                {related.slice(0, 4).map((entry) => (
                  <div key={entry.id} className={styles.relatedCard}>
                    <strong>{entry.title}</strong>
                    <span>{entry.projectTag || entry.tags[0] || "关联材料"}</span>
                    <small>{formatDate(entry.processedAt ?? entry.capturedAt)}</small>
                  </div>
                ))}
                {related.length === 0 && <p className={styles.mutedText}>暂时没有公开关联。</p>}
              </div>
            </section>
          </article>
        )}
      </main>

      <aside className={styles.infoPane} aria-label="页面信息">
        {selectedEntry && view ? (
          <>
            <InfoPanel title="页面信息">
              <InfoRow label="页面类型" value="知识页面" />
              <InfoRow label="页面 ID" value={`pub_${selectedEntry.id.slice(0, 12)}`} />
              <InfoRow label="创建时间" value={formatDate(view.capturedAt)} />
              <InfoRow label="最后更新" value={formatDate(view.processedAt ?? view.capturedAt)} />
              <InfoRow label="字数统计" value={`${articleLength(view)} 字`} />
              <InfoRow label="阅读时长" value={`约 ${Math.max(1, Math.ceil(articleLength(view) / 450))} 分钟`} />
            </InfoPanel>

            <InfoPanel title="公开状态">
              <div className={styles.statusLine}>
                <span />
                <strong>已发布</strong>
              </div>
              <p className={styles.mutedText}>公开可访问。</p>
            </InfoPanel>

            <InfoPanel title="导出格式">
              <div className={styles.exportGrid}>
                <a href="/api/agent?format=markdown">Markdown</a>
                <a href="/api/agent?format=json">JSON</a>
                <a href="/api/agent?format=feed">RSS</a>
              </div>
            </InfoPanel>

            <InfoPanel title="可读对象类型">
              <div className={styles.objectTypes}>
                <span>interpretation</span>
                <span>author_note</span>
                <span>claim</span>
                <span>relation</span>
              </div>
            </InfoPanel>

            <InfoPanel title="相关主题">
              <div className={styles.objectTypes}>
                {displayTags(selectedEntry).map((tag) => (
                  <span key={tag}># {tag}</span>
                ))}
              </div>
            </InfoPanel>

            <InfoPanel title="分享与引用">
              <div className={styles.shareBox}>https://studio.lumihelia.com/p/pub_{selectedEntry.id.slice(0, 8)}</div>
              <div className={styles.exportGrid}>
                <button type="button">复制链接</button>
                <a href="/api/agent?format=markdown">导出 Markdown</a>
                <a href="/api/agent?format=json">查看 JSON</a>
              </div>
            </InfoPanel>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>没有页面信息。</p>
            <span>公开后这里会显示导出和 agent-readable 元数据。</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function ArticleSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.articleSection}>
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.infoPanel}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function displayTags(entry: Entry): string[] {
  return entry.tags.length > 0 ? entry.tags.slice(0, 4) : [SOURCE_TYPE_LABEL[entry.sourceType]];
}

// Each section only appears when its content actually exists — an entry with
// nothing written in a given field simply has fewer sections, never a
// placeholder. Numbering is derived from this list's order, not hardcoded.
function buildArticleSections(view: PublicView): Array<{ title: string; body: ReactNode }> {
  const sections: Array<{ title: string; body: ReactNode } | null> = [
    view.whatItSays ? { title: "这篇内容讲了什么", body: <p>{view.whatItSays}</p> } : null,
    view.coreBullets.length > 0
      ? {
          title: "核心观点",
          body: (
            <ul>
              {view.coreBullets.slice(0, 4).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ),
        }
      : null,
    view.retell ? { title: "复述", body: <p>{view.retell}</p> } : null,
    view.relevanceToMe ? { title: "这和我的关系", body: <p>{view.relevanceToMe}</p> } : null,
    view.captureNote ? { title: "作者附注", body: <p>{view.captureNote}</p> } : null,
    view.judgmentStatement
      ? {
          title: "相关判断",
          body: (
            <div className={styles.claimBox}>
              <span>我判断：</span>
              {view.judgmentStatement}
            </div>
          ),
        }
      : null,
  ];
  return sections.filter((section): section is { title: string; body: ReactNode } => section !== null);
}

function articleLength(view: PublicView): number {
  return [
    view.title,
    view.whatItSays ?? "",
    view.relevanceToMe ?? "",
    view.judgmentStatement ?? "",
    view.captureNote ?? "",
    view.coreBullets.join(""),
  ].join("").length;
}

function buildTopicCounts(entries: Entry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of displayTags(entry)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}
