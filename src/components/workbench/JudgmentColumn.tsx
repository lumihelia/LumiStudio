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

  return (
    <div className={styles.column}>
      <p className={styles.label}>判断</p>

      {entry.captureNote && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>刚刚想到</span>
          <p className={styles.captureNote}>{entry.captureNote}</p>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="relevance">
          跟我有什么关系
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
        <span className={styles.fieldLabel}>接到哪个项目</span>
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

      {related.length > 0 && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>它还牵到了什么</span>
          <p className={styles.relatedHint}>同一个项目里的其他材料</p>
          <ul className={styles.relatedList}>
            {related.map((r) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ul>
        </div>
      )}

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
