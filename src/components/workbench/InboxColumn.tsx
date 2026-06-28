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
  return (
    <div className={styles.column}>
      <p className={styles.label}>工作台里的东西</p>
      {entries.length === 0 ? (
        <p className={styles.empty}>工作台里还没有东西。去手机端收一条试试。</p>
      ) : (
        <div className={styles.list}>
          {entries.map((entry) => (
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
              <span className={styles.title}>{entry.title}</span>
              <span className={styles.meta}>
                {SOURCE_TYPE_LABEL[entry.sourceType]} · {STATUS_LABEL[entry.status]} ·{" "}
                {formatRelative(entry.capturedAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
