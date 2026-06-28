import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL, STATUS_LABEL } from "../../data/types";
import { formatRelative } from "../../utils/format";
import styles from "./InboxColumn.module.css";

interface InboxColumnProps {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function InboxColumn({ entries, selectedId, onSelect }: InboxColumnProps) {
  const groups = [
    {
      label: "待处理",
      entries: entries.filter((entry) => entry.status === "captured" && !entry.judgmentStatement),
    },
    {
      label: "已有想法",
      entries: entries.filter((entry) => entry.status === "captured" && entry.judgmentStatement),
    },
    {
      label: "已处理",
      entries: entries.filter((entry) => entry.status !== "captured"),
    },
  ].filter((group) => group.entries.length > 0);

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <p className={styles.label}>今天收进来的</p>
        <span>{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className={styles.empty}>工作台里还没有东西。去手机端收一条试试。</p>
      ) : (
        groups.map((group) => (
          <section key={group.label} className={styles.section}>
            <p className={styles.sectionLabel}>
              {group.label} <span>{group.entries.length}</span>
            </p>
            <div className={styles.list}>
              {group.entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  className={
                    entry.id === selectedId
                      ? `${styles.row} ${styles.rowActive}`
                      : styles.row
                  }
                >
                  <span className={styles.rowTop}>
                    <span className={styles.title}>{entry.title}</span>
                    <span className={styles.time}>{formatRelative(entry.capturedAt)}</span>
                  </span>
                  <span className={styles.note}>
                    {entry.captureNote || entry.whatItSays || STATUS_LABEL[entry.status]}
                  </span>
                  <span className={styles.meta}>
                    {SOURCE_TYPE_LABEL[entry.sourceType]}
                    {entry.projectTag ? ` · ${entry.projectTag}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
