import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { useAppState } from "../state/useAppState";
import { loadMyContext, toCaptureMyContext } from "../utils/myContext";
import { authHeaders } from "../utils/clientCapture";
import {
  buildHonestFallback,
  type RelationCard,
  type RelationEntryInput,
  type RelationKind,
} from "../utils/relations";
import styles from "./GravityPage.module.css";

interface TopicSummary {
  name: string;
  count: number;
  description: string;
}

const RELATION_KINDS: RelationKind[] = ["相似的想法", "支撑它的材料", "冲突 / 张力", "延伸出去的问题"];
const MAX_ENTRIES_PER_CALL = 8;

const RELATION_GUIDANCE: Record<RelationKind, string> = {
  "相似的想法": "这条材料和当前主题里的另一些想法呼应。先确认它们说的是不是同一件事，再决定要不要合并成一个更稳定的判断。",
  "支撑它的材料": "这条材料可能为某个判断提供了证据。看清楚它支撑的是哪个具体判断，值得的话就把它接到那个项目里。",
  "冲突 / 张力": "这条材料和某个已有的想法或判断产生了张力，需要你自己判断站哪边、还是两者都保留——这一步 AI 不会替你做决定。",
  "延伸出去的问题": "这是材料本身或你长期关心的问题里浮现出的一个开放问题，还没有答案，先记下来即可。",
};

export function GravityPage() {
  const { entries, dispatch } = useAppState();
  const entriesRef = useRef<Entry[]>(entries);
  entriesRef.current = entries;

  const topics = useMemo(() => buildTopics(entries), [entries]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const activeTopic = selectedTopic ?? topics[0]?.name ?? "等待主题";

  const [relationState, setRelationState] = useState<{
    topic: string;
    cards: RelationCard[];
    loading: boolean;
    available: boolean;
  }>({ topic: "", cards: [], loading: false, available: true });
  const cacheRef = useRef<Map<string, { cards: RelationCard[]; available: boolean }>>(new Map());

  useEffect(() => {
    if (!activeTopic || activeTopic === "等待主题") return;

    const cached = cacheRef.current.get(activeTopic);
    if (cached) {
      setRelationState({ topic: activeTopic, loading: false, ...cached });
      return;
    }

    const topicEntries = selectTopicEntries(activeTopic, entriesRef.current);
    if (topicEntries.length === 0) {
      setRelationState({ topic: activeTopic, cards: [], loading: false, available: true });
      return;
    }

    let cancelled = false;
    setRelationState({ topic: activeTopic, cards: [], loading: true, available: true });

    const payload = {
      topic: activeTopic,
      entries: topicEntries.map(toRelationEntryInput),
      myContext: toCaptureMyContext(loadMyContext()),
    };

    void authHeaders().then((authorization) => fetch("/api/relations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authorization },
      body: JSON.stringify(payload),
    }))
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((result: { available: boolean; cards: RelationCard[] }) => {
        if (cancelled) return;
        const resolved = result.available
          ? result
          : { available: false, cards: buildHonestFallback(payload.entries) };
        cacheRef.current.set(activeTopic, resolved);
        setRelationState({ topic: activeTopic, loading: false, ...resolved });
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = { available: false, cards: buildHonestFallback(payload.entries) };
        cacheRef.current.set(activeTopic, fallback);
        setRelationState({ topic: activeTopic, loading: false, ...fallback });
      });

    return () => {
      cancelled = true;
    };
  }, [activeTopic]);

  const relations = relationState.topic === activeTopic ? relationState.cards : [];
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const selectedRelation =
    relations.find((relation) => relation.id === selectedRelationId) ?? relations[0] ?? null;
  const sourceEntry = selectedRelation?.entryId
    ? entries.find((entry) => entry.id === selectedRelation.entryId)
    : undefined;

  const grouped = groupRelations(relations);

  return (
    <div className={styles.shell}>
      <aside className={styles.topicPane} aria-label="正在牵动的主题">
        <div className={styles.paneHeader}>
          <div>
            <h2>正在牵动的主题</h2>
            <span>{topics.length}</span>
          </div>
          <span className={styles.filterIcon} aria-hidden="true" />
        </div>

        <div className={styles.topicList}>
          {topics.length === 0 ? (
            <div className={styles.emptyState}>
              <p>还没有主题。</p>
              <span>在工作台里把材料接到项目后，引力台会开始成形。</span>
            </div>
          ) : (
            topics.map((topic) => (
              <button
                key={topic.name}
                type="button"
                className={
                  topic.name === activeTopic
                    ? `${styles.topicButton} ${styles.topicButtonActive}`
                    : styles.topicButton
                }
                onClick={() => setSelectedTopic(topic.name)}
              >
                <span className={styles.topicIcon} aria-hidden="true" />
                <span>
                  <strong>{topic.name}</strong>
                  <small>{topic.description}</small>
                </span>
                <em>{topic.count}</em>
              </button>
            ))
          )}
        </div>

        <Link to="/settings" className={styles.contextCard}>
          <strong>我的上下文</strong>
          <span>判断上下文 / 设置</span>
        </Link>
      </aside>

      <main className={styles.mapPane} aria-label="关系地图">
        <div className={styles.mapHeader}>
          <div>
            <h1>{activeTopic}</h1>
            <p>
              {relationState.loading
                ? "正在判断这些材料之间的真实关系…"
                : !relationState.available
                  ? "还没有连接关系判断模型，下面先按标签/项目诚实分组，不代表已经判断出真实关系。"
                  : `探索与"${activeTopic}"相关的想法、张力与支撑材料。`}
            </p>
          </div>
        </div>

        <div className={styles.laneStack}>
          {RELATION_KINDS.map((kind, index) => (
            <section
              key={kind}
              className={
                kind === "延伸出去的问题" ? `${styles.lane} ${styles.questionLane}` : styles.lane
              }
            >
              <div className={styles.laneTitle}>
                <span>{index + 1}</span>
                <h2>{kind}</h2>
              </div>
              <div className={styles.cardRail}>
                {(grouped[kind] ?? []).length === 0 ? (
                  <p className={styles.laneEmpty}>还没有发现这类关系。</p>
                ) : (
                  (grouped[kind] ?? []).map((relation) => (
                    <button
                      type="button"
                      key={relation.id}
                      className={
                        relation.id === selectedRelation?.id
                          ? `${styles.relationCard} ${styles.relationCardActive}`
                          : styles.relationCard
                      }
                      onClick={() => setSelectedRelationId(relation.id)}
                    >
                      <strong>{relation.title}</strong>
                      <span>{relation.description}</span>
                      <small>{relation.meta}</small>
                    </button>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        <div className={styles.legend}>
          <span>相似想法</span>
          <span>支撑材料</span>
          <span>张力冲突</span>
          <span>延伸问题</span>
        </div>
      </main>

      <aside className={styles.detailPane} aria-label="关系详情">
        <div className={styles.sideHeader}>
          <h2>关系详情</h2>
          <span className={styles.filterIcon} aria-hidden="true" />
        </div>

        {selectedRelation ? (
          <section className={styles.detailCard}>
            <span className={styles.kindChip}>{selectedRelation.kind}</span>
            <h3>{selectedRelation.title}</h3>
            <p>{selectedRelation.description}</p>

            <div className={styles.detailSection}>
              <h4>怎么处理</h4>
              <p>{RELATION_GUIDANCE[selectedRelation.kind]}</p>
            </div>

            <div className={styles.actionGrid}>
              <button
                type="button"
                className={styles.primaryAction}
                disabled={!sourceEntry}
                onClick={() => {
                  if (!sourceEntry) return;
                  dispatch({
                    type: "UPDATE_JUDGMENT",
                    payload: {
                      id: sourceEntry.id,
                      projectTag: activeTopic,
                    },
                  });
                }}
              >
                接到项目里
              </button>
              <button
                type="button"
                disabled={!sourceEntry}
                onClick={() => {
                  if (!sourceEntry) return;
                  dispatch({
                    type: "UPDATE_JUDGMENT",
                    payload: {
                      id: sourceEntry.id,
                      judgmentStatement:
                        sourceEntry.judgmentStatement ||
                        `${selectedRelation.title}：${selectedRelation.description}`,
                    },
                  });
                }}
              >
                写成一段
              </button>
            </div>

            <Link to="/workbench">查看更多相关关系 →</Link>
          </section>
        ) : (
          <div className={styles.emptyState}>
            <p>还没有可查看的关系。</p>
            <span>先在工作台里把材料接到项目。</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function buildTopics(entries: Entry[]): TopicSummary[] {
  const counts = new Map<string, { count: number; descriptions: Set<string> }>();
  for (const entry of entries) {
    if (!entry.projectTag) continue;
    const item = counts.get(entry.projectTag) ?? { count: 0, descriptions: new Set<string>() };
    item.count += 1;
    item.descriptions.add(entry.coreBullets[0] || entry.whatItSays || entry.captureNote);
    counts.set(entry.projectTag, item);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({
      name,
      count: value.count,
      description:
        Array.from(value.descriptions).find(Boolean)?.slice(0, 28) ||
        "等待更多材料形成关系",
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"))
    .slice(0, 6);
}

function selectTopicEntries(topic: string, entries: Entry[]): Entry[] {
  const topicEntries = entries.filter((entry) => entry.projectTag === topic);
  const source = topicEntries.length > 0 ? topicEntries : entries.slice(0, MAX_ENTRIES_PER_CALL);
  return source.slice(0, MAX_ENTRIES_PER_CALL);
}

function toRelationEntryInput(entry: Entry): RelationEntryInput {
  return {
    id: entry.id,
    title: entry.title,
    sourceType: entry.sourceType,
    whatItSays: entry.whatItSays,
    relevanceToMe: entry.relevanceToMe,
    judgmentStatement: entry.judgmentStatement,
    captureNote: entry.captureNote,
    tags: entry.tags,
    projectTag: entry.projectTag,
    status: entry.status,
  };
}

function groupRelations(relations: RelationCard[]) {
  return relations.reduce<Record<RelationKind, RelationCard[]>>(
    (groups, relation) => {
      groups[relation.kind].push(relation);
      return groups;
    },
    {
      "相似的想法": [],
      "支撑它的材料": [],
      "冲突 / 张力": [],
      "延伸出去的问题": [],
    }
  );
}
