import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { SOURCE_TYPE_LABEL, STATUS_SHORT_LABEL } from "../data/types";
import { useAppState } from "../state/useAppState";
import { formatDate, formatRelative } from "../utils/format";
import styles from "./WorkbenchPage.module.css";

const DEFAULT_PROJECT = "LumiStudio 产品阅读";

type ProcessingField = "captureNote" | "relevanceToMe" | "judgmentStatement";
type ProcessingTab = "thought" | "relation" | "judgment" | "action";
type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_STATE_LABEL: Record<SaveState, string> = {
  idle: "",
  saving: "保存中...",
  saved: "已保存",
  error: "保存失败，稍后再试",
};

export function WorkbenchPage() {
  const { entries, dispatch } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<ProcessingField, string>>({
    captureNote: "",
    relevanceToMe: "",
    judgmentStatement: "",
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [discardConfirming, setDiscardConfirming] = useState(false);
  const [activeProcessingTab, setActiveProcessingTab] = useState<ProcessingTab>("thought");

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

  useEffect(() => {
    if (!selectedEntry) return;
    setDraft({
      captureNote: selectedEntry.captureNote,
      relevanceToMe: selectedEntry.relevanceToMe,
      judgmentStatement: selectedEntry.judgmentStatement,
    });
    setSaveState("idle");
    setDiscardConfirming(false);
    // Only re-sync when switching to a different entry - the 3s poll must not
    // clobber text the user is mid-typing in the same entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntry?.id]);

  const updateSelected = (fields: Partial<Entry>) => {
    if (!selectedEntry) return;
    dispatch({ type: "UPDATE_JUDGMENT", payload: { id: selectedEntry.id, ...fields } });
  };

  const commitField = (field: ProcessingField, value: string, onComplete?: (ok: boolean) => void) => {
    if (!selectedEntry || value === selectedEntry[field]) {
      onComplete?.(true);
      return;
    }
    const patch: Partial<Pick<Entry, ProcessingField>> = { [field]: value } as Partial<
      Pick<Entry, ProcessingField>
    >;
    setSaveState("saving");
    dispatch({
      type: "UPDATE_JUDGMENT",
      payload: {
        id: selectedEntry.id,
        ...patch,
        onSettled: (ok) => {
          setSaveState(ok ? "saved" : "error");
          onComplete?.(ok);
        },
      },
    });
  };

  const routeSelected = (destination: "published" | "parked") => {
    if (!selectedEntry) return;
    dispatch({ type: "ROUTE_ENTRY", payload: { id: selectedEntry.id, destination } });
  };

  const publishSelected = () => {
    if (!selectedEntry) return;
    commitField("judgmentStatement", draft.judgmentStatement, (ok) => {
      if (ok) routeSelected("published");
    });
  };

  const discardEntry = (id: string) => {
    dispatch({ type: "DISCARD_ENTRY", payload: { id } });
    if (selectedId === id) setSelectedId(null);
  };

  const relatedEntries = selectedEntry
    ? findRelatedEntries(selectedEntry, sortedEntries).slice(0, 3)
    : [];
  const needsReprocessing = selectedEntry
    ? !selectedEntry.retell.trim() || selectedEntry.coreBullets.length < 3
    : false;

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
                    <strong>{inboxTopic(entry)}</strong>
                    <small>{SOURCE_TYPE_LABEL[entry.sourceType]}</small>
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
            <h1>{selectedEntry.title}</h1>
            <div className={styles.metaLine}>
              <span>{SOURCE_TYPE_LABEL[selectedEntry.sourceType]}</span>
              <span>{formatDate(selectedEntry.capturedAt)}</span>
              <span>{estimateReadTime(selectedEntry)} 分钟阅读</span>
              <span>{STATUS_SHORT_LABEL[selectedEntry.status]}</span>
              <span>{selectedEntry.isPublic ? "公开" : "私有"}</span>
            </div>
            <div className={styles.tagRow}>
              {normalizedTags(selectedEntry).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            {needsReprocessing && (
              <div className={styles.analysisNotice} role="status">
                <strong>这条材料尚未完成整理。</strong>
                <span>旧版流程只保存了原始摘录，没有生成可信的概述、要点和复述。</span>
                <Link to="/">用原始链接或正文重新收进来</Link>
              </div>
            )}

            <Section title={needsReprocessing ? "原始材料摘录" : "这篇讲了什么"}>
              <p className={styles.articleBody}>{selectedEntry.whatItSays}</p>
            </Section>

            <Section title="核心观点">
              {!needsReprocessing && selectedEntry.coreBullets.length > 0 ? (
                <ul className={styles.bulletList}>
                  {selectedEntry.coreBullets.slice(0, 5).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.sectionEmpty}>完成整理后，这里会显示材料本身的关键观点。</p>
              )}
            </Section>

            <Section title="复述">
              {needsReprocessing ? (
                <p className={styles.sectionEmpty}>旧版流程没有生成复述。重新收进来后，这里会给出一段可编辑的口语化解释。</p>
              ) : (
                <p className={styles.articleBody}>{selectedEntry.retell}</p>
              )}
            </Section>

            {isHttpUrl(selectedEntry.origin) && (
              <a className={styles.readMore} href={selectedEntry.origin} target="_blank" rel="noreferrer">
                阅读全文 →
              </a>
            )}
          </article>
        )}
      </main>

      <aside className={styles.processingPane} aria-label="我的处理">
        <div className={styles.sideHeader}>
          <h2>我的处理</h2>
          {saveState !== "idle" ? (
            <span className={styles.mutedText}>{SAVE_STATE_LABEL[saveState]}</span>
          ) : (
            <span className={styles.filterIcon} aria-hidden="true" />
          )}
        </div>

        {!selectedEntry ? (
          <div className={styles.emptyState}>
            <p>先选择一条材料。</p>
            <span>右侧会显示判断、项目连接和下一步动作。</span>
          </div>
        ) : (
          <div className={styles.processingWorkspace}>
            <div className={styles.processingTabs} role="tablist" aria-label="我的处理">
              {([
                ["thought", "想法"],
                ["relation", "关系"],
                ["judgment", "判断"],
                ["action", "去处"],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeProcessingTab === tab}
                  className={activeProcessingTab === tab ? `${styles.processingTab} ${styles.processingTabActive}` : styles.processingTab}
                  onClick={() => setActiveProcessingTab(tab)}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeProcessingTab === "thought" && (
              <Panel title="刚刚想到" eyebrow="想法">
              <label className={styles.publishToggle}>
                <input
                  type="checkbox"
                  checked={selectedEntry.publishCaptureNote}
                  onChange={(event) => updateSelected({ publishCaptureNote: event.target.checked })}
                />
                公开这条——勾选后才会出现在公开页，留空或不勾选都不会
              </label>
              <textarea
                value={draft.captureNote}
                onChange={(event) => setDraft((d) => ({ ...d, captureNote: event.target.value }))}
                onBlur={(event) => commitField("captureNote", event.target.value)}
                aria-label="刚刚想到"
                placeholder="你当时为什么觉得它值得留下？"
              />
              <time>{formatRelative(selectedEntry.capturedAt)}</time>
              </Panel>
            )}

            {activeProcessingTab === "relation" && (
              <Panel title="和我有什么关系" eyebrow="关系">
              <label className={styles.publishToggle}>
                <input
                  type="checkbox"
                  checked={selectedEntry.publishRelevanceToMe}
                  onChange={(event) => updateSelected({ publishRelevanceToMe: event.target.checked })}
                />
                公开这条——勾选后才会出现在公开页，留空或不勾选都不会
              </label>
              <textarea
                value={draft.relevanceToMe}
                onChange={(event) => setDraft((d) => ({ ...d, relevanceToMe: event.target.value }))}
                onBlur={(event) => commitField("relevanceToMe", event.target.value)}
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
              <div className={styles.relationSummary}>
                <strong>{relatedEntries.length > 0 ? `发现 ${relatedEntries.length} 条相关材料` : "尚未发现明确关联"}</strong>
                <Link to="/gravity">查看引力台 →</Link>
              </div>
              </Panel>
            )}

            {activeProcessingTab === "judgment" && (
              <Panel title="我的判断" eyebrow="判断">
              <textarea
                value={draft.judgmentStatement}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, judgmentStatement: event.target.value }))
                }
                onBlur={(event) => commitField("judgmentStatement", event.target.value)}
                aria-label="我的判断"
                placeholder="这条材料让你形成了什么判断？放到公开页之前，这里需要是你自己的话。"
              />
              </Panel>
            )}

            {activeProcessingTab === "action" && (
              <Panel title="这条材料的去处" eyebrow="行动">
              <button
                type="button"
                className={styles.actionPrimary}
                disabled={!draft.judgmentStatement.trim()}
                onClick={publishSelected}
              >
                {selectedEntry.status === "published" ? "更新公开页" : "放到公开页"}
              </button>
              <div className={styles.fateRow}>
                <button type="button" onClick={() => routeSelected("parked")}>
                  先放着
                </button>
                <button
                  type="button"
                  className={discardConfirming ? styles.discardConfirming : styles.discardAction}
                  onClick={() => {
                    if (discardConfirming) {
                      discardEntry(selectedEntry.id);
                      return;
                    }
                    setDiscardConfirming(true);
                    window.setTimeout(() => setDiscardConfirming(false), 4000);
                  }}
                >
                  {discardConfirming ? "确定不留？" : "不留了"}
                </button>
              </div>
              </Panel>
            )}
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

function inboxTopic(entry: Entry): string {
  return entry.tags[0] || SOURCE_TYPE_LABEL[entry.sourceType];
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
