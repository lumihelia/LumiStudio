import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { SOURCE_TYPE_LABEL, STATUS_SHORT_LABEL } from "../data/types";
import { useAppState } from "../state/useAppState";
import { formatDate, formatRelative } from "../utils/format";
import styles from "./WorkbenchPage.module.css";

const DEFAULT_PROJECT = "LumiStudio 产品阅读";

export function WorkbenchPage() {
  const { entries, dispatch } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.status === "captured" && b.status !== "captured") return -1;
      if (b.status === "captured" && a.status !== "captured") return 1;
      return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    });
  }, [entries]);

  const selectedEntry = sortedEntries.find((entry) => entry.id === selectedId) ?? null;

  useEffect(() => {
    if (sortedEntries.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !sortedEntries.some((entry) => entry.id === selectedId)) {
      setSelectedId(sortedEntries[0].id);
    }
  }, [selectedId, sortedEntries]);

  const updateSelected = (fields: Partial<Entry>) => {
    if (!selectedEntry) return;
    dispatch({ type: "UPDATE_JUDGMENT", payload: { id: selectedEntry.id, ...fields } });
  };

  const routeSelected = (destination: "published" | "connected" | "parked") => {
    if (!selectedEntry) return;
    dispatch({ type: "ROUTE_ENTRY", payload: { id: selectedEntry.id, destination } });
  };

  const discardEntry = (id: string) => {
    dispatch({ type: "DISCARD_ENTRY", payload: { id } });
    if (selectedId === id) setSelectedId(null);
  };

  const relatedEntries = selectedEntry
    ? findRelatedEntries(selectedEntry, sortedEntries).slice(0, 3)
    : [];

  return (
    <div className={styles.shell}>
      <aside className={styles.inboxPane} aria-label="今天收进来的材料">
        <div className={styles.paneHeader}>
          <div>
            <h2>今天收进来的</h2>
            <span>{sortedEntries.length}</span>
          </div>
          <span className={styles.filterIcon} aria-hidden="true" />
        </div>

        <div className={styles.inboxList}>
          {sortedEntries.length === 0 ? (
            <div className={styles.emptyState}>
              <p>还没有材料。</p>
              <span>先从收进来入口添加一条，再回到这里捋一捋。</span>
            </div>
          ) : (
            sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.id === selectedEntry?.id
                    ? `${styles.inboxRow} ${styles.inboxRowActive}`
                    : styles.inboxRow
                }
              >
                <button
                  type="button"
                  className={styles.inboxItem}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className={styles.sourceIcon}>{SOURCE_TYPE_LABEL[entry.sourceType].slice(0, 1)}</span>
                  <span className={styles.itemText}>
                    <strong>{entry.title}</strong>
                    <small>
                      {entry.origin || SOURCE_TYPE_LABEL[entry.sourceType]} · {STATUS_SHORT_LABEL[entry.status]}
                    </small>
                  </span>
                  <time>{formatRelative(entry.capturedAt)}</time>
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`从界面移除 ${entry.title}`}
                  onClick={() => discardEntry(entry.id)}
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>

        <Link to="/settings" className={styles.contextCard}>
          <strong>我的上下文</strong>
          <span>判断上下文 / 设置</span>
        </Link>
      </aside>

      <main className={styles.materialPane} aria-label="当前材料详情">
        {!selectedEntry ? (
          <div className={styles.materialEmpty}>
            <h1>等一条材料进来</h1>
            <p>工作台会把材料、判断、关系和下一步动作放在同一个视野里。</p>
          </div>
        ) : (
          <article className={styles.materialArticle}>
            <div className={styles.articleTools}>
              <button type="button" aria-label="保留到稍后">[]</button>
              <button type="button" aria-label="更多操作">...</button>
            </div>
            <input
              className={styles.titleInput}
              value={selectedEntry.title}
              onChange={(event) => updateSelected({ title: event.target.value })}
              aria-label="材料标题"
              placeholder="给这条材料起个标题"
            />
            <div className={styles.metaLine}>
              <span>{SOURCE_TYPE_LABEL[selectedEntry.sourceType]}</span>
              <span>{selectedEntry.origin || "未记录来源"}</span>
              <span>{formatDate(selectedEntry.capturedAt)}</span>
              <span>{estimateReadTime(selectedEntry)} 分钟阅读</span>
              <span>{STATUS_SHORT_LABEL[selectedEntry.status]}</span>
              <span>{selectedEntry.isPublic ? "公开" : "私有"}</span>
            </div>
            <div className={styles.tagRow}>
              {normalizedTags(selectedEntry).map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() =>
                    updateSelected({
                      tags: selectedEntry.tags.includes(tag)
                        ? selectedEntry.tags.filter((item) => item !== tag)
                        : [...selectedEntry.tags, tag],
                    })
                  }
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (!selectedEntry.tags.includes("待判断")) {
                    updateSelected({ tags: [...selectedEntry.tags, "待判断"] });
                  }
                }}
              >
                +
              </button>
            </div>

            <Section title="这篇讲了什么">
              <div className={styles.summaryBox}>
                <textarea
                  value={selectedEntry.whatItSays}
                  onChange={(event) => updateSelected({ whatItSays: event.target.value })}
                  aria-label="这篇讲了什么"
                  placeholder="先把原材料本身讲清楚，不要急着下判断。"
                />
              </div>
            </Section>

            <Section title="核心观点">
              <ul className={styles.bulletList}>
                {coreBulletsFor(selectedEntry).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </Section>

            <Section title="内容预览">
              <p>
                {selectedEntry.whatItSays ||
                  "这条材料还没有被整理。收进来的链接会先变成来源、摘要、标签和可继续处理的线索。"}
              </p>
              <p>
                {selectedEntry.relevanceToMe ||
                  "回到电脑后，用户在这里确认它和自己的项目、判断或行动之间的关系。"}
              </p>
            </Section>

            <a className={styles.readMore} href={selectedEntry.origin || "#"}>
              阅读全文 →
            </a>
          </article>
        )}
      </main>

      <aside className={styles.processingPane} aria-label="我的处理">
        <div className={styles.sideHeader}>
          <h2>我的处理</h2>
          <span className={styles.filterIcon} aria-hidden="true" />
        </div>

        {!selectedEntry ? (
          <div className={styles.emptyState}>
            <p>先选择一条材料。</p>
            <span>右侧会显示判断、项目连接和下一步动作。</span>
          </div>
        ) : (
          <div className={styles.sideStack}>
            <Panel title="刚刚想到" eyebrow="想法">
              <textarea
                value={selectedEntry.captureNote}
                onChange={(event) => updateSelected({ captureNote: event.target.value })}
                aria-label="刚刚想到"
                placeholder="你当时为什么觉得它值得留下？"
              />
              <time>{formatRelative(selectedEntry.capturedAt)}</time>
            </Panel>

            <Panel title="和我有什么关系" eyebrow="关系">
              <textarea
                value={selectedEntry.relevanceToMe}
                onChange={(event) => updateSelected({ relevanceToMe: event.target.value })}
                aria-label="和我有什么关系"
                placeholder="它影响哪个判断、项目或行动？"
              />
              <div className={styles.chipLine}>
                <button
                  type="button"
                  onClick={() => updateSelected({ projectTag: DEFAULT_PROJECT })}
                >
                  {selectedEntry.projectTag || DEFAULT_PROJECT}
                </button>
                <button
                  type="button"
                  aria-label="接到默认项目"
                  onClick={() => updateSelected({ projectTag: DEFAULT_PROJECT })}
                >
                  +
                </button>
              </div>
            </Panel>

            <Panel title="它还牵到了什么" eyebrow="关联">
              {relatedEntries.length === 0 ? (
                <p className={styles.mutedText}>还没找到明确关系。添加项目或标签后，引力台会出现更多张力。</p>
              ) : (
                <div className={styles.relatedList}>
                  {relatedEntries.map((entry) => (
                    <div key={entry.id} className={styles.relatedItem}>
                      <span>{entry.title}</span>
                      <small>{entry.projectTag || entry.tags[0] || "相似材料"}</small>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/gravity">查看更多关联 →</Link>
            </Panel>

            <Panel title="下一步" eyebrow="行动">
              <div className={styles.actionGrid}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => {
                    updateSelected({ projectTag: selectedEntry.projectTag || DEFAULT_PROJECT });
                    routeSelected("connected");
                  }}
                >
                  接到项目里
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSelected({
                      judgmentStatement:
                        selectedEntry.judgmentStatement ||
                        selectedEntry.relevanceToMe ||
                        selectedEntry.whatItSays,
                    })
                  }
                >
                  写成一段
                </button>
                <button
                  type="button"
                  onClick={() => updateSelected({ nextAction: "变成任务" })}
                >
                  变成任务
                </button>
                <button
                  type="button"
                  disabled={!selectedEntry.judgmentStatement.trim()}
                  onClick={() => routeSelected("published")}
                >
                  放到公开页
                </button>
              </div>
              <button
                type="button"
                className={styles.fullWidthAction}
                onClick={() => routeSelected("parked")}
              >
                先放着
              </button>
            </Panel>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.articleSection}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function normalizedTags(entry: Entry): string[] {
  const tags = entry.tags.length > 0 ? entry.tags : [SOURCE_TYPE_LABEL[entry.sourceType]];
  return Array.from(new Set(tags)).slice(0, 4);
}

function coreBulletsFor(entry: Entry): string[] {
  if (entry.coreBullets.length > 0) return entry.coreBullets.slice(0, 4);
  return [
    entry.whatItSays || "先把材料本身讲清楚。",
    entry.relevanceToMe || "再判断它和我有什么关系。",
    entry.nextAction || "最后决定接到项目、写成一段、变成任务，还是先放着。",
  ];
}

function findRelatedEntries(entry: Entry, entries: Entry[]): Entry[] {
  return entries.filter((candidate) => {
    if (candidate.id === entry.id) return false;
    if (entry.projectTag && candidate.projectTag === entry.projectTag) return true;
    return candidate.tags.some((tag) => entry.tags.includes(tag));
  });
}

function estimateReadTime(entry: Entry): number {
  const text = [
    entry.title,
    entry.whatItSays,
    entry.relevanceToMe,
    entry.judgmentStatement,
    entry.coreBullets.join(""),
  ].join("");
  return Math.max(1, Math.ceil(text.length / 450));
}
