import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "../data/types";
import { useAppState } from "../state/useAppState";
import { formatRelative } from "../utils/format";
import styles from "./GravityPage.module.css";

type RelationKind = "相似的想法" | "支撑它的材料" | "冲突 / 张力" | "延伸出去的问题";

interface TopicSummary {
  name: string;
  count: number;
  description: string;
}

interface RelationCardModel {
  id: string;
  kind: RelationKind;
  title: string;
  description: string;
  meta: string;
  sourceEntry?: Entry;
}

export function GravityPage() {
  const { entries, dispatch } = useAppState();
  const topics = useMemo(() => buildTopics(entries), [entries]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const activeTopic = selectedTopic ?? topics[0]?.name ?? "等待主题";
  const relations = useMemo(
    () => buildRelations(activeTopic, entries),
    [activeTopic, entries]
  );
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const selectedRelation =
    relations.find((relation) => relation.id === selectedRelationId) ?? relations[0] ?? null;

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
              <span>给材料添加标签或项目后，引力台会开始成形。</span>
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
            <p>探索与“{activeTopic}”相关的想法、张力与支撑材料。</p>
          </div>
          <div className={styles.articleTools}>
            <button type="button" aria-label="保留到稍后">[]</button>
            <button type="button" aria-label="更多操作">...</button>
          </div>
        </div>

        <div className={styles.laneStack}>
          {(["相似的想法", "支撑它的材料", "冲突 / 张力", "延伸出去的问题"] as RelationKind[]).map(
            (kind, index) => (
              <section
                key={kind}
                className={
                  kind === "延伸出去的问题"
                    ? `${styles.lane} ${styles.questionLane}`
                    : styles.lane
                }
              >
                <div className={styles.laneTitle}>
                  <span>{index + 1}</span>
                  <h2>{kind}</h2>
                </div>
                <div className={styles.cardRail}>
                  {(grouped[kind] ?? []).map((relation) => (
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
                  ))}
                  <button type="button" className={styles.addCard}>
                    <span>+</span>
                    {kind === "冲突 / 张力" ? "发现更多张力" : kind === "延伸出去的问题" ? "提出新问题" : "添加更多"}
                  </button>
                </div>
              </section>
            )
          )}
        </div>

        <div className={styles.legend}>
          <span>相似想法</span>
          <span>支撑材料</span>
          <span>张力冲突</span>
          <span>延伸问题</span>
          <span>相互关联</span>
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
              <h4>为什么重要</h4>
              <p>
                它决定这条材料是进入判断、支撑项目，还是先作为一个没有想清楚的问题保留下来。
              </p>
            </div>

            <div className={styles.detailSection}>
              <h4>对我有什么影响</h4>
              <ul>
                <li>影响工作台里材料的下一步动作。</li>
                <li>影响公开页里哪些内容可以被 agents 读取。</li>
                <li>影响长期主题是否形成稳定判断。</li>
              </ul>
            </div>

            <div className={styles.detailSection}>
              <h4>可以怎么处理</h4>
              <ul>
                <li>保留关系，但等待用户确认。</li>
                <li>接到项目里，作为后续写作或任务线索。</li>
                <li>如果仍不清楚，就先放着。</li>
              </ul>
            </div>

            <div className={styles.actionGrid}>
              <button
                type="button"
                className={styles.primaryAction}
                disabled={!selectedRelation.sourceEntry}
                onClick={() => {
                  if (!selectedRelation.sourceEntry) return;
                  dispatch({
                    type: "UPDATE_JUDGMENT",
                    payload: {
                      id: selectedRelation.sourceEntry.id,
                      projectTag: activeTopic,
                    },
                  });
                  dispatch({
                    type: "ROUTE_ENTRY",
                    payload: {
                      id: selectedRelation.sourceEntry.id,
                      destination: "connected",
                    },
                  });
                }}
              >
                接到项目里
              </button>
              <button
                type="button"
                disabled={!selectedRelation.sourceEntry}
                onClick={() => {
                  if (!selectedRelation.sourceEntry) return;
                  dispatch({
                    type: "UPDATE_JUDGMENT",
                    payload: {
                      id: selectedRelation.sourceEntry.id,
                      judgmentStatement:
                        selectedRelation.sourceEntry.judgmentStatement ||
                        `${selectedRelation.title}：${selectedRelation.description}`,
                    },
                  });
                }}
              >
                写成一段
              </button>
              <button type="button">形成原则</button>
              <button type="button">先放着</button>
            </div>

            <Link to="/workbench">查看更多相关关系 →</Link>
          </section>
        ) : (
          <div className={styles.emptyState}>
            <p>还没有可查看的关系。</p>
            <span>先在工作台里接到项目或添加标签。</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function buildTopics(entries: Entry[]): TopicSummary[] {
  const counts = new Map<string, { count: number; descriptions: Set<string> }>();
  for (const entry of entries) {
    const keys = [entry.projectTag, ...entry.tags].filter(Boolean) as string[];
    for (const key of keys) {
      const item = counts.get(key) ?? { count: 0, descriptions: new Set<string>() };
      item.count += 1;
      item.descriptions.add(entry.coreBullets[0] || entry.whatItSays || entry.captureNote);
      counts.set(key, item);
    }
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

function buildRelations(topic: string, entries: Entry[]): RelationCardModel[] {
  const topicEntries = entries.filter(
    (entry) => entry.projectTag === topic || entry.tags.includes(topic)
  );
  const source = topicEntries.length > 0 ? topicEntries : entries.slice(0, 3);

  const similar = source.slice(0, 3).map((entry) => ({
    id: `similar-${entry.id}`,
    kind: "相似的想法" as const,
    title: entry.title,
    description: entry.captureNote || entry.relevanceToMe || "和当前主题有相似线索。",
    meta: `${formatRelative(entry.capturedAt)} · ${entry.tags[0] || entry.projectTag || "材料"}`,
    sourceEntry: entry,
  }));

  const supporting = source
    .filter((entry) => entry.sourceType !== "clue")
    .slice(0, 3)
    .map((entry) => ({
      id: `support-${entry.id}`,
      kind: "支撑它的材料" as const,
      title: entry.title,
      description: entry.whatItSays || "可以作为这个主题的材料证据。",
      meta: `${entry.sourceType} · ${formatRelative(entry.capturedAt)}`,
      sourceEntry: entry,
    }));

  const tensions: RelationCardModel[] = source.slice(0, 3).map((entry, index) => ({
    id: `tension-${entry.id}`,
    kind: "冲突 / 张力",
    title:
      index === 0
        ? `${topic} vs 用户确认`
        : `${entry.title.slice(0, 12)} vs 可公开表达`,
    description: entry.relevanceToMe || "这里可能需要用户决定边界，而不是让 agent 自动吸收。",
    meta: entry.status === "published" ? "已公开" : "待确认",
    sourceEntry: entry,
  }));

  const questions: RelationCardModel[] = [
    {
      id: `question-${topic}-1`,
      kind: "延伸出去的问题",
      title: `这条线索最后应该流向哪里？`,
      description: `围绕“${topic}”还没有形成稳定去向，需要继续观察。`,
      meta: "待探索",
    },
    {
      id: `question-${topic}-2`,
      kind: "延伸出去的问题",
      title: `哪些判断可以公开，哪些还在形成中？`,
      description: "公开页需要给人和 agents 读，但不能把未确认判断伪装成结论。",
      meta: "待探索",
    },
  ];

  return [...similar, ...supporting, ...tensions, ...questions];
}

function groupRelations(relations: RelationCardModel[]) {
  return relations.reduce<Record<RelationKind, RelationCardModel[]>>(
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
