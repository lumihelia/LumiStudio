import { useState } from "react";
import type { Entry } from "../../data/types";
import { KNOWN_PROJECTS } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import { RoutingActions } from "../shared/RoutingActions";
import styles from "./JudgmentColumn.module.css";

interface JudgmentColumnProps {
  entry: Entry | null;
  onDiscarded: () => void;
}

export function JudgmentColumn({ entry, onDiscarded }: JudgmentColumnProps) {
  const { entries, dispatch } = useAppState();
  const [customProject, setCustomProject] = useState("");
  const [relationStatus, setRelationStatus] = useState("");

  if (!entry) {
    return (
      <div className={styles.column}>
        <p className={styles.label}>判断</p>
        <p className={styles.prompt}>先在左边选一条材料。</p>
      </div>
    );
  }

  const update = (fields: Partial<Entry>) =>
    dispatch({ type: "UPDATE_JUDGMENT", payload: { id: entry.id, ...fields } });

  const related = entry.projectTag
    ? entries.filter((e) => e.id !== entry.id && e.projectTag === entry.projectTag)
    : [];

  const similar = entries
    .filter(
      (e) =>
        e.id !== entry.id &&
        e.tags.some((tag) => entry.tags.includes(tag)) &&
        !related.some((r) => r.id === e.id)
    )
    .slice(0, 2);

  return (
    <div className={styles.column}>
      <p className={styles.label}>我的处理</p>

      {entry.captureNote && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>刚刚想到</span>
          <p className={styles.captureNote}>{entry.captureNote}</p>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="whatItSays">
          它讲了什么
        </label>
        <textarea
          id="whatItSays"
          className={styles.textarea}
          rows={3}
          value={entry.whatItSays}
          placeholder="先把原材料本身讲清楚，不要急着下判断"
          onChange={(e) => update({ whatItSays: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="relevance">
          和我有什么关系
        </label>
        <textarea
          id="relevance"
          className={styles.textarea}
          rows={3}
          value={entry.relevanceToMe}
          placeholder="为什么这条值得占用我的时间"
          onChange={(e) => update({ relevanceToMe: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>它接到哪里</span>
        <div className={styles.projectRow}>
          <button
            type="button"
            className={
              !entry.projectTag
                ? `${styles.projectChip} ${styles.projectChipActive}`
                : styles.projectChip
            }
            onClick={() => update({ projectTag: null })}
          >
            不连接
          </button>
          {KNOWN_PROJECTS.map((project) => (
            <button
              key={project}
              type="button"
              className={
                entry.projectTag === project
                  ? `${styles.projectChip} ${styles.projectChipActive}`
                  : styles.projectChip
              }
              onClick={() => update({ projectTag: project })}
            >
              {project}
            </button>
          ))}
        </div>
        <input
          className={styles.textInput}
          type="text"
          placeholder="或者，输入一个新项目名，按回车"
          value={customProject}
          onChange={(e) => setCustomProject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customProject.trim()) {
              update({ projectTag: customProject.trim() });
              setCustomProject("");
            }
          }}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>它还牵到了什么</span>
        <p className={styles.relatedHint}>引力台的种子：先展示可解释的关系，不编造冲突。</p>
        <div className={styles.relationStack}>
          {related.slice(0, 2).map((r) => (
            <RelationCard
              key={r.id}
              label="可以补充的项目"
              title={r.title}
              onAction={(action) => {
                if (action === "接到项目" && r.projectTag) update({ projectTag: r.projectTag });
                if (action === "写成一段") {
                  update({
                    judgmentStatement: entry.judgmentStatement
                      ? `${entry.judgmentStatement}\n这条还需要和「${r.title}」一起看。`
                      : `这条还需要和「${r.title}」一起看。`,
                  });
                }
                setRelationStatus(`已标记：${action} · ${r.title}`);
              }}
            />
          ))}
          {similar.map((r) => (
            <RelationCard
              key={r.id}
              label="相似的想法"
              title={r.title}
              onAction={(action) => setRelationStatus(`已标记：${action} · ${r.title}`)}
            />
          ))}
          {related.length === 0 && similar.length === 0 && (
            <div className={styles.relationEmpty}>
              <span>还没形成关系</span>
              <p>接到项目或添加标签后，这里会出现相似、补充或待确认的关联。</p>
            </div>
          )}
        </div>
        {relationStatus && <p className={styles.relationStatus}>{relationStatus}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="judgment">
          写成一段
        </label>
        <textarea
          id="judgment"
          className={styles.textarea}
          rows={4}
          value={entry.judgmentStatement}
          placeholder="如果只能留一句话，会是什么"
          onChange={(e) => update({ judgmentStatement: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="nextAction">
          下一步
        </label>
        <div className={styles.quickActions}>
          {["变成任务", "加入证据", "打开问题"].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => update({ nextAction: action })}
            >
              {action}
            </button>
          ))}
        </div>
        <input
          id="nextAction"
          className={styles.textInput}
          type="text"
          value={entry.nextAction}
          placeholder="可以小到一句话"
          onChange={(e) => update({ nextAction: e.target.value })}
        />
      </div>

      <RoutingActions entry={entry} onDiscarded={onDiscarded} />
    </div>
  );
}

function RelationCard({
  label,
  title,
  onAction,
}: {
  label: string;
  title: string;
  onAction: (action: string) => void;
}) {
  return (
    <div className={styles.relationCard}>
      <span>{label}</span>
      <p>{title}</p>
      <div className={styles.relationActions}>
        {["保留", "接到项目", "写成一段", "先放着", "不要"].map((action) => (
          <button key={action} type="button" onClick={() => onAction(action)}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
